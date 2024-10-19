import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { connectServer } from './server-service';
import {
  addActiveMatchServer,
  addServer,
  addServerWithStatus,
  getServer,
  getServerData,
  removeServerWithStatus,
  setServer,
  setServerData,
} from '@bf2-matchmaking/redis/servers';
import { getJoinmeDirect, getJoinmeHref } from '@bf2-matchmaking/utils';
import { disconnect, hasNoVehicles } from './rcon/bf2-rcon-api';
import { getServerLocation } from './external-service';
import { ServersRow } from '@bf2-matchmaking/types';
import { ServerStatus } from '@bf2-matchmaking/types/server';
import { error, info, verbose } from '@bf2-matchmaking/logging';
import { json } from '@bf2-matchmaking/redis/json';
import { AppEngineState } from '@bf2-matchmaking/types/engine';
import { hash } from '@bf2-matchmaking/redis/hash';
import { del } from '@bf2-matchmaking/redis/generic';
import { Server as RedisServer } from '@bf2-matchmaking/redis/types';
import { DateTime } from 'luxon';

export const Server = {
  init: async (address: string) => {
    const server = await client().getServer(address).then(verifySingleResult);
    const status = await connectServer(address);

    if (status === ServerStatus.IDLE) {
      try {
        const data = await buildServerData(server);
        await setServerData(address, data);
      } catch (e) {
        error('Server.init', e);
      }
    }

    await addServer(address, status);
    info('Server.init', `${address} Initialized with status ${status}`);
    return getServer(address);
  },
  update: (address: string, server: Partial<RedisServer>) => {
    return hash(`servers:${address}`).set(server);
  },
  getData: (address: string) => {
    return getServerData(address);
  },
  setMatch: async (address: string, matchId: string | number) => {
    info('Server.setMatch', `Server ${address} assigning to match ${matchId}`);
    await addActiveMatchServer(address, matchId.toString());
    await removeServerWithStatus(address, ServerStatus.IDLE);
  },
  findByMatch: async (matchId: string | number) => {
    return hash<Record<string, string>>('servers:active').get(matchId.toString());
  },
  reset: async (address: string) => {
    verbose('Server.reset', `Server ${address}: Resetting...`);
    await removeServerWithStatus(address, ServerStatus.ACTIVE);
    await addServerWithStatus(address, ServerStatus.IDLE);
    await json<AppEngineState>('app:engine:state').delProperty(address.replace('.', ''));
  },
  restart: async (address: string) => {
    await setServer(address, {
      status: ServerStatus.RESTARTING,
      updatedAt: DateTime.now().toISO(),
      errorAt: undefined,
    });
    return getServer(address);
  },
  delete: async (address: string) => {
    await removeServerWithStatus(address, ServerStatus.IDLE);
    await removeServerWithStatus(address, ServerStatus.OFFLINE);
    await removeServerWithStatus(address, ServerStatus.ACTIVE);
    await removeServerWithStatus(address, ServerStatus.LACKING);
    await del([
      `servers:${address}`,
      `servers:info:${address}`,
      `servers:live:${address}`,
    ]);
    await hash('cache:rcons').delEntry(address);
    disconnect(address);
    return 'ok';
  },
};

async function buildServerData(server: ServersRow) {
  const { ip, port, demos_path, name } = server;
  const joinmeHref = await getJoinmeHref(ip, port);
  const joinmeDirect = await getJoinmeDirect(ip, port);
  const { city, country } = await getServerLocation(ip);
  const noVehicles = await hasNoVehicles(ip);

  return {
    port,
    name,
    joinmeHref,
    joinmeDirect,
    country,
    city,
    noVehicles,
    demos_path,
  };
}
