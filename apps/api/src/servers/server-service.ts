import {
  addServerWithStatus,
  getActiveMatchServer,
  getServer,
  getServerLive,
  getServerLiveInfo,
  getServersWithStatus,
  removeServerWithStatus,
} from '@bf2-matchmaking/redis/servers';
import {
  error,
  info,
  logErrorMessage,
  logMessage,
  verbose,
} from '@bf2-matchmaking/logging';
import {
  DbServer,
  isNotNull,
  LiveServer,
  LiveServerStatus,
  PendingServer,
  ServerInfo,
  ServerRconsRow,
} from '@bf2-matchmaking/types';
import { createSocket, disconnect, getServerInfo } from '@bf2-matchmaking/services/rcon';
import { del } from '@bf2-matchmaking/redis/generic';
import { assertObj, wait } from '@bf2-matchmaking/utils';
import { getDnsByIp } from '../platform/cloudflare';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { createServer } from '@bf2-matchmaking/services/server';
import { DateTime } from 'luxon';
import { json } from '@bf2-matchmaking/redis/json';
import { ServiceError } from '@bf2-matchmaking/services/error';

export async function getLiveServerByMatchId(matchId: string) {
  const address = await getActiveMatchServer(matchId);
  verbose(
    'getLiveServerByMatchId',
    `No active match server found for matchId=${matchId}`
  );
  if (address) {
    return getLiveServer(address);
  }
  return null;
}

export async function getLiveServer(address: string): Promise<LiveServer | null> {
  try {
    const info = await getServer(address);
    const values = await getServerLive(address);
    const live = await getServerLiveInfo(address);

    return {
      address,
      ...info,
      live,
      errorAt: values?.errorAt,
      updatedAt: values?.updatedAt,
      port: Number(info.port),
      status: values?.status as LiveServerStatus,
      noVehicles: info.noVehicles,
      matchId: null,
    };
  } catch (e) {
    error(`getLiveServer:${address}`, e);
    return null;
  }
}

export async function getLiveServers(): Promise<LiveServer[]> {
  const idleServers = await getServersWithStatus('idle');
  const offlineServers = await getServersWithStatus('offline');
  const liveServers = await getServersWithStatus('active');
  const lackingServers = await getServersWithStatus('lacking');
  return (
    await Promise.all(
      [...idleServers, ...offlineServers, ...liveServers, ...lackingServers].map(
        getLiveServer
      )
    )
  ).filter(isNotNull);
}

export async function resetLiveServer(address: string) {
  verbose('resetLiveServer', `Server ${address}: Resetting...`);
  await removeServerWithStatus(address, 'active');
  await addServerWithStatus(address, 'idle');
}

export async function deleteServer(address: string) {
  await removeServerWithStatus(address, 'idle');
  await removeServerWithStatus(address, 'offline');
  await removeServerWithStatus(address, 'active');
  await removeServerWithStatus(address, 'lacking');
  await del([`server:${address}`, `server:${address}:info`, `rcon:${address}`]);
  disconnect(address);
}

export async function getAddress(ip: string) {
  const dns = await getDnsByIp(ip);
  return dns?.name || ip;
}

export function createPendingServer(server: PendingServer, retries: number) {
  connectPendingServer(server)
    .then(() => {
      logMessage(
        `Server ${server.address}: Connected pending server after ${retries} retries`
      );
    })
    .catch((e) => {
      error('createPendingServer', e);
      if (retries < 10) {
        wait(10).then(() => createPendingServer(server, retries++));
      } else {
        logErrorMessage(`Server ${server.address}: Failed to connect pending server`, e);
      }
    });
}
export async function connectPendingServer(server: PendingServer) {
  const { address, port, rcon_port, rcon_pw, demo_path } = server;

  await json<ServerRconsRow>(`rcon:${address}`).set({
    id: address,
    rcon_port,
    rcon_pw,
    created_at: DateTime.now().toISO(),
  });
  const socket = createSocket({
    id: address,
    rcon_port,
    rcon_pw,
    created_at: DateTime.now().toISO(),
  });
  assertObj(socket, 'Failed to create socket');

  const { data: serverInfo } = await getServerInfo(address);
  assertObj(serverInfo, 'Failed to get server info');

  const dbServer = await upsertServer(
    address,
    port,
    rcon_port,
    rcon_pw,
    serverInfo,
    demo_path
  );
  info(
    'connectPendingServer',
    `Upserted server ${address} with name ${serverInfo.serverName}`
  );
  await createServer(dbServer);
}

export async function upsertServer(
  address: string,
  port: string,
  rcon_port: number,
  rcon_pw: string,
  serverInfo: ServerInfo,
  demo_path?: string
): Promise<DbServer> {
  const { data: server, error: serverError } = await client().upsertServer({
    ip: address,
    port,
    name: serverInfo.serverName,
    demos_path: demo_path,
  });
  if (serverError) {
    error('upsertServer', serverError);
    throw ServiceError.BadGateway('Failed to add server to database');
  }

  const { data: serverRcon, error: serverRconError } = await client().upsertServerRcon({
    id: address,
    rcon_port,
    rcon_pw,
  });
  if (serverRconError) {
    error('upsertServerRcon', serverRconError);
    throw ServiceError.BadGateway('Failed to add server rcon to database');
  }

  return { ...server, rcon: serverRcon };
}
