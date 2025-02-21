import {
  getAllServers,
  getServer,
  getServerDataSafe,
  getServerLiveInfo,
} from '@bf2-matchmaking/redis/servers';
import { error, info, logErrorMessage, logMessage, warn } from '@bf2-matchmaking/logging';
import { isNotNull, PendingServer, ServerInfo, ServersRow } from '@bf2-matchmaking/types';
import { createSocket, getServerInfo } from '@bf2-matchmaking/services/rcon';
import { assertObj, wait } from '@bf2-matchmaking/utils';
import { getDnsByIp } from '../platform/cloudflare';
import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { ServiceError } from '@bf2-matchmaking/services/error';
import { hash } from '@bf2-matchmaking/redis/hash';
import { Server } from '@bf2-matchmaking/services/server/Server';
import { LiveServer } from '@bf2-matchmaking/types/server';
import { generateUsersXml } from '../players/users-generator';

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
  const servers = await getAllServers();
  return (await Promise.all(servers.map(getLiveServer))).filter(isNotNull);
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
export async function connectPendingServer(pendingServer: PendingServer) {
  const { address, port, rcon_port, rcon_pw, demo_path } = pendingServer;

  await hash('cache:rcons').setEntries([[address, rcon_pw]]);

  const socket = createSocket(address, rcon_pw);
  assertObj(socket, 'Failed to create socket');

  const { data: serverInfo } = await getServerInfo(address);
  assertObj(serverInfo, 'Failed to get server info');

  const server = await upsertServer(
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
  await Server.init(server);
}

export async function upsertServer(
  address: string,
  port: string,
  rcon_port: number,
  rcon_pw: string,
  serverInfo: ServerInfo,
  demos_path: string
): Promise<ServersRow> {
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

  const { error: serverRconError } = await client().upsertServerRcon({
    id: address,
    rcon_port,
    rcon_pw,
  });
  if (serverRconError) {
    error('upsertServerRcon', serverRconError);
    throw ServiceError.BadGateway('Failed to add server rcon to database');
  }

  return server;
}

export async function getAdmins(admins: 'all' | 'none' | number) {
  if (admins === 'all') {
    const players = await client().getPlayers().then(verifyResult);
    return Buffer.from(generateUsersXml(players)).toString('base64');
  }
  if (admins === 'none') {
    return null;
  }
  return null;
}
