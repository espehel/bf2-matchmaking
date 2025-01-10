import { createLiveInfo, getJoinmeDirect, getJoinmeHref } from './server-service';
import {
  addActiveMatchServer,
  addServer,
  addServerWithStatus,
  getActiveMatchServer,
  getServer,
  getServerData,
  removeServerWithStatus,
  setServer,
  setServerData,
} from '@bf2-matchmaking/redis/servers';
import { disconnect, hasNoVehicles } from './rcon/bf2-rcon-api';
import { getServerLocation } from './external-service';
import { LogContext, ServersRow } from '@bf2-matchmaking/types';
import { ServerStatus } from '@bf2-matchmaking/types/server';
import {
  info,
  logErrorMessage,
  logMessage,
  logWarnMessage,
} from '@bf2-matchmaking/logging';
import { json } from '@bf2-matchmaking/redis/json';
import { AppEngineState } from '@bf2-matchmaking/types/engine';
import { hash } from '@bf2-matchmaking/redis/hash';
import { del } from '@bf2-matchmaking/redis/generic';
import { Server as RedisServer } from '@bf2-matchmaking/redis/types';
import { DateTime } from 'luxon';
import { stream } from '@bf2-matchmaking/redis/stream';
import { parseError } from '@bf2-matchmaking/utils';

function logServerMessage(address: string, message: string, context?: LogContext) {
  logMessage(`Server ${address}: ${message}`, context);
  stream(`servers:${address}:log`)
    .log(message, 'info')
    .catch((e) =>
      logErrorMessage(`Server ${address}: Error logging server message`, e, context)
    );
}

function logServerError(
  address: string,
  message: string,
  e: unknown,
  context?: LogContext
) {
  logWarnMessage(`Server ${address}: ${message}`, { ...context, error: e });
  stream(`servers:${address}:log`)
    .log(parseError(e), 'error')
    .catch((e) =>
      logErrorMessage(`Server ${address}: Error logging server error`, e, context)
    );
}

export const Server = {
  init: async (server: ServersRow) => {
    const { ip: address } = server;
    logServerMessage(address, 'Initializing server connection', { server });

    let status = ServerStatus.OFFLINE;
    try {
      await createLiveInfo(address, true);
      status = ServerStatus.IDLE;
    } catch (e) {
      logServerError(address, 'Failed to create live info', e, { server });
    }

    try {
      await createServerData(server);
    } catch (e) {
      logServerError(address, 'Failed to create server data', e, { server, status });
    }

    await addServer(address, status);
    logServerMessage(address, `Server connection initialized with status ${status}`, {
      server,
    });
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
    await setServer(address, { status: ServerStatus.ACTIVE, matchId: Number(matchId) });
    await addActiveMatchServer(address, matchId.toString());
    await removeServerWithStatus(address, ServerStatus.IDLE);
    logServerMessage(address, `Assigned to match ${matchId}`);
  },
  findByMatch: async (matchId: string | number) => {
    return getActiveMatchServer(matchId.toString());
  },
  reset: async (address: string) => {
    info('Server.reset', `Server ${address}: Resetting...`);
    await setServer(address, { status: ServerStatus.IDLE, matchId: undefined });
    await removeServerWithStatus(address, ServerStatus.ACTIVE);
    await addServerWithStatus(address, ServerStatus.IDLE);
    await json<AppEngineState>('app:engine:state').delProperty(address.replace('.', ''));
    logServerMessage(address, 'Server reset');
  },
  restart: async (address: string) => {
    await setServer(address, {
      status: ServerStatus.RESTARTING,
      updatedAt: DateTime.now().toISO(),
      errorAt: undefined,
    });
    await del([`servers:${address}:info`, `servers:${address}:data`]);
    logServerMessage(address, 'Server restarting');
    return getServer(address);
  },
  delete: async (address: string) => {
    await removeServerWithStatus(address, ServerStatus.IDLE);
    await removeServerWithStatus(address, ServerStatus.OFFLINE);
    await removeServerWithStatus(address, ServerStatus.ACTIVE);
    await del([
      `servers:${address}`,
      `servers:${address}:info`,
      `servers:${address}:data`,
    ]);
    await hash('cache:rcons').delEntry(address);
    disconnect(address);
    logServerMessage(address, 'Server deleted');
    return 'ok';
  },
};

async function createServerData(server: ServersRow) {
  const { ip, port, demos_path, name } = server;
  const joinmeHref = await getJoinmeHref(ip, port);
  const joinmeDirect = await getJoinmeDirect(ip, port);
  const { city, country } = await getServerLocation(ip);
  const noVehicles = await hasNoVehicles(ip);

  const data = {
    port,
    name,
    joinmeHref,
    joinmeDirect,
    country,
    city,
    noVehicles,
    demos_path,
  };
  const res = await setServerData(server.ip, data);
  info('createServerData', `Server ${server.ip}: Server data created. [result=${res}]`);

  return data;
}
