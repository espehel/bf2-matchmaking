import {
  DbServer,
  LiveInfo,
  LiveServerStatus,
  ServerRconsRow,
} from '@bf2-matchmaking/types';
import { error, info } from '@bf2-matchmaking/logging';
import { externalApi, getJoinmeDirect, getJoinmeHref } from '@bf2-matchmaking/utils';
import { getPlayerList, getServerInfo, hasNoVehicles } from './rcon/bf2-rcon-api';
import {
  addServerWithStatus,
  setServer,
  setServerLive,
  setServerLiveInfo,
} from '@bf2-matchmaking/redis/servers';
import { DateTime } from 'luxon';

export async function createServer(server: DbServer): Promise<LiveServerStatus> {
  const status = server.rcon ? await connectServer(server.rcon) : 'lacking';
  const { ip: address, port, demos_path, name } = server;
  const joinmeHref = await getJoinmeHref(address, port);
  const joinmeDirect = await getJoinmeDirect(address, port);
  const { data: location } = await externalApi.ip().getIpLocation(address);
  const noVehicles = isConnectedStatus(status)
    ? (await hasNoVehicles(address)).data
    : null;
  const country = location?.country || '';
  const city = location?.city || '';

  await setServer(server.ip, {
    port,
    name,
    joinmeHref,
    joinmeDirect,
    country,
    city,
    noVehicles,
    demos_path,
  });
  await setServerLive(address, { status });
  await addServerWithStatus(address, status);
  return status;
}

export async function connectServer(rcon: ServerRconsRow): Promise<'offline' | 'idle'> {
  try {
    const liveInfo = await buildLiveState(rcon.id);
    let status: LiveServerStatus = 'offline';
    if (liveInfo) {
      await setServerLiveInfo(rcon.id, liveInfo);
      status = 'idle';
    }
    info('connectServer', `${rcon.id} Initialized with status ${status}`);
    return status;
  } catch (e) {
    error('connectServer', e);
    return 'offline';
  }
}

export async function buildLiveState(address: string): Promise<LiveInfo> {
  const { data: info, error, readyState } = await getServerInfo(address);
  if (error) {
    throw new Error(`${address}[${readyState}]: ${error.message}`);
  }

  if (info.connectedPlayers === '0') {
    return { ...info, players: [] };
  }

  const { data: players } = await getPlayerList(address);

  if (!players || players.length !== Number(info.connectedPlayers)) {
    throw new Error(`${address}[${readyState}]: Invalid live state`);
  }

  return { ...info, players };
}

function isConnectedStatus(status: LiveServerStatus) {
  return status === 'idle' || status === 'active';
}

export async function updateLiveServer(address: string): Promise<LiveInfo | null> {
  const now = DateTime.now().toISO();

  try {
    const live = await buildLiveState(address);
    await setServerLive(address, { errorAt: undefined, updatedAt: now });
    await setServerLiveInfo(address, live);
    return live;
  } catch (e) {
    error('updateLiveServer', e);
    await setServerLive(address, { errorAt: now });
    return null;
  }
}
