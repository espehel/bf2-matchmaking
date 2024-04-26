import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { error, info, logErrorMessage } from '@bf2-matchmaking/logging';
import {
  DbServer,
  isNotNull,
  isNull,
  LiveServerStatus,
  ServerRconsRow,
} from '@bf2-matchmaking/types';
import {
  addServerWithStatus,
  getServer,
  resetDb,
  setRcon,
  setServer,
  setServerInfo,
} from '@bf2-matchmaking/redis';
import { buildLiveInfo } from './servers';
import { externalApi, getJoinmeDirect, getJoinmeHref } from '@bf2-matchmaking/utils';
import { hasNoVehicles } from '../rcon/bf2-rcon-api';
import { DateTime } from 'luxon';
import { connectSockets } from '../rcon/socket-manager';

export async function initServers() {
  try {
    await resetDb();
    const servers = await client().getServers().then(verifyResult);
    const connectedServers = await connectSockets(
      servers.map((s) => s.rcon).filter(isNotNull)
    );
    info(
      'initServers',
      `Connected ${connectedServers.filter(isNotNull).length}/${
        servers.length
      } server sockets (${connectedServers.filter(isNull).length} failed)`
    );
    const serverStatuses = await Promise.all(servers.map(createServer));
    info('initServers', `Created ${serverStatuses.length}} live servers`);
  } catch (e) {
    console.log(e);
    logErrorMessage('Failed to init live servers', e);
  }
}

export async function createServer(server: DbServer): Promise<LiveServerStatus> {
  const status = server.rcon ? await connectServer(server.rcon) : 'lacking';
  const { ip: address, port: gamePort } = server;
  const joinmeHref = await getJoinmeHref(address, gamePort);
  const joinmeDirect = await getJoinmeDirect(address, gamePort);
  const { data: location } = await externalApi.ip().getIpLocation(address);
  const noVehicles = isConnectedStatus(status)
    ? (await hasNoVehicles(address)).toString()
    : '';
  const country = location?.country || '';
  const city = location?.city || '';
  await setServer(server.ip, {
    address,
    status,
    gamePort,
    joinmeHref,
    joinmeDirect,
    country,
    city,
    noVehicles,
    updatedAt: DateTime.now().toISO() || '',
  });
  await addServerWithStatus(address, status);
  return status;
}

export async function connectServer(rcon: ServerRconsRow): Promise<LiveServerStatus> {
  try {
    await setRcon(rcon);
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

export async function getLiveServer2(address: string) {
  const server = await getServer(address);
  return server;
}

function isConnectedStatus(status: LiveServerStatus) {
  return status === 'idle' || status === 'live';
}
