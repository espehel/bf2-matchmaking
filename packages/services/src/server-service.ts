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
import dns from 'dns';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';

export async function createLiveInfo(
  address: string,
  shouldLog: boolean
): Promise<LiveInfo> {
  const { data: serverInfo, error, readyState } = await getServerInfo(address);
  if (error) {
    throw new Error(`${address}[${readyState}]: ${error.message}`);
  }

  if (serverInfo.connectedPlayers === '0') {
    return { ...serverInfo, players: [] };
  }

  const { data: players } = await getPlayerList(address);

  if (!players || players.length !== Number(serverInfo.connectedPlayers)) {
    throw new Error(`${address}[${readyState}]: Invalid live state`);
  }

  const liveInfo = { ...serverInfo, players };
  const res = await setServerLiveInfo(address, liveInfo);

  if (shouldLog) {
    info(
      'createLiveInfo',
      `Server ${address}: Server live info created. [result=${res}]`
    );
  }

  return liveInfo;
}

export async function updateLiveServer(address: string): Promise<LiveInfo | null> {
  const now = DateTime.now().toISO();

  const server = await getServer(address);
  try {
    const live = await createLiveInfo(address, false);

    if (server.status === ServerStatus.RESTARTING) {
      await client().getServer(address).then(verifySingleResult).then(Server.init);
      return live;
    }

    await Server.update(address, { errorAt: undefined, updatedAt: now });
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

export async function getJoinmeHref(ip: string, port: string): Promise<string> {
  return new Promise<string>((resolve) => {
    dns.resolve4(ip, (err, addresses) => {
      const ip = addresses?.at(0);
      if (ip && !err) {
        resolve(`https://joinme.click/g/bf2/${ip}:${port}`);
      } else {
        resolve(`https://joinme.click/g/bf2/${ip}:${port}`);
      }
    });
  });
}

export async function getJoinmeDirect(ip: string, port: string): Promise<string> {
  return new Promise<string>((resolve) => {
    dns.resolve4(ip, (err, addresses) => {
      const ip = addresses?.at(0);
      if (ip && !err) {
        resolve(`bf2://${ip}:${port}`);
      } else {
        resolve(`bf2://${ip}:${port}`);
      }
    });
  });
}
