import {
  getServer,
  getServerDataSafe,
  getServerLiveInfo,
  getServersWithStatus,
} from '@bf2-matchmaking/redis/servers';
import { error, info, logErrorMessage, logMessage, warn } from '@bf2-matchmaking/logging';
import { DbServer, isNotNull, PendingServer, ServerInfo } from '@bf2-matchmaking/types';
import { createSocket, getServerInfo } from '@bf2-matchmaking/services/rcon';
import { assertObj, wait } from '@bf2-matchmaking/utils';
import { getDnsByIp } from '../platform/cloudflare';
import { client } from '@bf2-matchmaking/supabase';
import { ServiceError } from '@bf2-matchmaking/services/error';
import { hash } from '@bf2-matchmaking/redis/hash';
import { Server } from '@bf2-matchmaking/services/server/Server';
import { LiveServer, ServerStatus } from '@bf2-matchmaking/types/server';

export async function getLiveServerByMatchId(matchId: string) {
  const address = await Server.findByMatch(matchId);
  if (address) {
    return getLiveServer(address);
  }
  warn('getLiveServerByMatchId', `No active match server found for matchId=${matchId}`);
  return null;
}

export async function getLiveServer(address: string): Promise<LiveServer | null> {
  try {
    const data = await getServerDataSafe(address);
    const values = await getServer(address);
    const live = await getServerLiveInfo(address);

    return {
      address,
      ...values,
      name: data?.name || 'offline',
      data,
      live,
    };
  } catch (e) {
    error(`getLiveServer:${address}`, e);
    return null;
  }
}

export async function getLiveServers(): Promise<LiveServer[]> {
  const idleServers = await getServersWithStatus(ServerStatus.IDLE);
  const offlineServers = await getServersWithStatus(ServerStatus.OFFLINE);
  const liveServers = await getServersWithStatus(ServerStatus.ACTIVE);
  return (
    await Promise.all(
      [...idleServers, ...offlineServers, ...liveServers].map(getLiveServer)
    )
  ).filter(isNotNull);
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

  await hash('cache:rcons').setEntries([[address, rcon_pw]]);

  const socket = createSocket(address, rcon_pw);
  assertObj(socket, 'Failed to create socket');

  const { data: serverInfo } = await getServerInfo(address);
  assertObj(serverInfo, 'Failed to get server info');

  await upsertServer(address, port, rcon_port, rcon_pw, serverInfo, demo_path);
  info(
    'connectPendingServer',
    `Upserted server ${address} with name ${serverInfo.serverName}`
  );
  await Server.init(address);
}

export async function upsertServer(
  address: string,
  port: string,
  rcon_port: number,
  rcon_pw: string,
  serverInfo: ServerInfo,
  demos_path: string
): Promise<DbServer> {
  const { data: server, error: serverError } = await client().upsertServer({
    ip: address,
    port,
    name: serverInfo.serverName,
    demos_path,
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
