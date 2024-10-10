import { LiveInfo, LiveServerStatus } from '@bf2-matchmaking/types';
import { error, info, logMessage } from '@bf2-matchmaking/logging';
import { externalApi, getJoinmeDirect, getJoinmeHref } from '@bf2-matchmaking/utils';
import { getPlayerList, getServerInfo, hasNoVehicles } from './rcon/bf2-rcon-api';
import {
  addServerWithStatus,
  getServerLive,
  removeServerWithStatus,
  setServer,
  setServerLive,
  setServerLiveInfo,
} from '@bf2-matchmaking/redis/servers';
import { DateTime } from 'luxon';
import { client } from '@bf2-matchmaking/supabase';

export async function createServer(address: string): Promise<LiveServerStatus> {
  const { data: server } = await client().getServer(address);
  const status = server ? await connectServer(address) : 'lacking';
  await setServerLive(address, { status });
  await addServerWithStatus(address, status);

  if (!server) {
    return status;
  }

  const { port, demos_path, name } = server;
  const joinmeHref = await getJoinmeHref(address, port);
  const joinmeDirect = await getJoinmeDirect(address, port);
  const { data: location } = await externalApi.ip().getIpLocation(address);
  const noVehicles = isConnectedStatus(status)
    ? (await hasNoVehicles(address)).data
    : null; // TODO change this value after server restart
  const country = location?.country || '';
  const city = location?.city || '';

  await setServer(address, {
    port,
    name,
    joinmeHref,
    joinmeDirect,
    country,
    city,
    noVehicles,
    demos_path,
  });
  return status;
}

export async function connectServer(address: string): Promise<'offline' | 'idle'> {
  try {
    const liveInfo = await buildLiveState(address);
    let status: LiveServerStatus = 'offline';
    if (liveInfo) {
      await setServerLiveInfo(address, liveInfo);
      status = 'idle';
    }
    info('connectServer', `${address} Initialized with status ${status}`);
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

  const server = await getServerLive(address);
  try {
    const live = await buildLiveState(address);
    await setServerLive(address, { errorAt: undefined, updatedAt: now });
    await setServerLiveInfo(address, live);
    return live;
  } catch (e) {
    if (!server.errorAt) {
      error('updateLiveServer', e);
      await setServerLive(address, { errorAt: now });
      return null;
    }
    if (DateTime.fromISO(server.errorAt).diffNow('hours').minutes < -30) {
      logMessage(`Server ${address} is offline`, { server });
      await removeServerWithStatus(address, 'idle');
      await addServerWithStatus(address, 'offline');
    }
    return null;
  }
}
