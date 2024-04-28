import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { error, info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import {
  DbServer,
  isNotNull,
  isNull,
  LiveServer,
  LiveServerStatus,
  PendingServer,
  ServerRconsRow,
} from '@bf2-matchmaking/types';
import {
  addServerWithStatus,
  deleteKeys,
  getPendingServer,
  getServer,
  getServerInfo,
  getServersWithStatus,
  removeServerWithStatus,
  resetDb,
  setPendingServer,
  setServer,
  setServerInfo,
} from '@bf2-matchmaking/redis';
import { buildLiveInfo, upsertServer } from './servers';
import {
  assertObj,
  externalApi,
  getJoinmeDirect,
  getJoinmeHref,
} from '@bf2-matchmaking/utils';
import { hasNoVehicles, getServerInfo as getBF2ServerInfo } from '../rcon/bf2-rcon-api';
import { DateTime } from 'luxon';
import { createSocket, createSockets, disconnect } from '../rcon/socket-manager';
import { wait } from '@bf2-matchmaking/utils/src/async-actions';

export async function initServers() {
  try {
    await resetDb();
    const servers = await client().getServers().then(verifyResult);
    const connectedServers = await createSockets(
      servers.map((s) => s.rcon).filter(isNotNull)
    );
    info(
      'initServers',
      `Connected ${connectedServers.filter(isNotNull).length}/${
        servers.length
      } server sockets (${connectedServers.filter(isNull).length} failed)`
    );
    const serverStatuses = await Promise.all(servers.map(createServer));
    info('initServers', `Created ${serverStatuses.length} live servers`);
  } catch (e) {
    console.log(e);
    logErrorMessage('Failed to init live servers', e);
  }
}

export async function createServer(server: DbServer): Promise<LiveServerStatus> {
  const status = server.rcon ? await connectServer(server.rcon) : 'lacking';
  const { ip: address, port } = server;
  const joinmeHref = await getJoinmeHref(address, port);
  const joinmeDirect = await getJoinmeDirect(address, port);
  const { data: location } = await externalApi.ip().getIpLocation(address);
  const noVehicles = isConnectedStatus(status)
    ? (await hasNoVehicles(address)).data?.toString() || ''
    : '';
  const country = location?.country || '';
  const city = location?.city || '';
  await setServer(server.ip, {
    address,
    status,
    port,
    joinmeHref,
    joinmeDirect,
    country,
    city,
    noVehicles,
    updatedAt: DateTime.utc().toISO() || '',
  });
  await addServerWithStatus(address, status);
  return status;
}

export async function connectServer(rcon: ServerRconsRow): Promise<LiveServerStatus> {
  try {
    const liveInfo = await buildLiveInfo(rcon.id);
    let status: LiveServerStatus = 'offline';
    if (liveInfo) {
      await setServerInfo(rcon.id, liveInfo);
      status = 'idle';
    }
    info('connectServer', `${rcon.id} Initialized with status ${status}`);
    return status;
  } catch (e) {
    error('connectServer', e);
    return 'offline';
  }
}

export async function getLiveServer(address: string): Promise<LiveServer | null> {
  try {
    const server = await getServer(address);
    const info = await getServerInfo(address);
    return {
      ...server,
      info,
      errorAt: null,
      port: Number(server.port),
      status: server.status as LiveServerStatus,
      noVehicles: server.noVehicles === 'true',
      matchId: null,
    };
  } catch (e) {
    error('getLiveServer', e);
    return null;
  }
}
export async function getLiveServers(): Promise<LiveServer[]> {
  const idleServers = await getServersWithStatus('idle');
  const offlineServers = await getServersWithStatus('offline');
  const liveServers = await getServersWithStatus('live');
  const lackingServers = await getServersWithStatus('lacking');
  return (
    await Promise.all(
      [...idleServers, ...offlineServers, ...liveServers, ...lackingServers].map(
        getLiveServer
      )
    )
  ).filter(isNotNull);
}

function isConnectedStatus(status: LiveServerStatus) {
  return status === 'idle' || status === 'live';
}

export async function deleteServer(address: string) {
  await removeServerWithStatus('idle');
  await removeServerWithStatus('offline');
  await removeServerWithStatus('live');
  await removeServerWithStatus('lacking');
  await deleteKeys(`server:${address}`, `server:${address}:info`, `rcon:${address}`);
  disconnect(address);
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

  const socket = createSocket({ address, port: rcon_port, pw: rcon_pw });
  assertObj(socket, 'Failed to create socket');

  const { data: serverInfo } = await getBF2ServerInfo(address);
  assertObj(serverInfo, 'Failed to get server info');

  const dbServer = await upsertServer(
    address,
    port,
    rcon_port,
    rcon_pw,
    serverInfo,
    demo_path
  );
  await createServer(dbServer);
}
