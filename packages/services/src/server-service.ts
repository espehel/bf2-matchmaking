import { LiveInfo } from '@bf2-matchmaking/types';
import { error, info, logMessage } from '@bf2-matchmaking/logging';
import { getPlayerList, getServerInfo } from './rcon/bf2-rcon-api';
import {
  addServerWithStatus,
  getServer,
  removeServerWithStatus,
  setServerLiveInfo,
} from '@bf2-matchmaking/redis/servers';
import { DateTime } from 'luxon';
import { ServerStatus } from '@bf2-matchmaking/types/server';
import { Server } from './Server';

export async function connectServer(address: string) {
  try {
    const liveInfo = await buildLiveState(address);
    let status = ServerStatus.OFFLINE;
    if (liveInfo) {
      await setServerLiveInfo(address, liveInfo);
      status = ServerStatus.IDLE;
    }
    info('connectServer', `${address} Initialized with status ${status}`);
    return status;
  } catch (e) {
    error('connectServer', e);
    return ServerStatus.OFFLINE;
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

export async function updateLiveServer(address: string): Promise<LiveInfo | null> {
  const now = DateTime.now().toISO();

  const server = await getServer(address);
  try {
    const live = await buildLiveState(address);

    if (server.status === ServerStatus.RESTARTING) {
      await Server.init(address);
      return live;
    }

    await Server.update(address, { errorAt: undefined, updatedAt: now });
    await setServerLiveInfo(address, live);
    return live;
  } catch (e) {
    if (!server.errorAt) {
      error('updateLiveServer', e);
      await Server.update(address, { errorAt: now });
      return null;
    }
    if (DateTime.fromISO(server.errorAt).diffNow('hours').minutes < -30) {
      logMessage(`Server ${address} is offline`, { server });
      await removeServerWithStatus(address, ServerStatus.IDLE);
      await addServerWithStatus(address, ServerStatus.OFFLINE);
    }
    return null;
  }
}
