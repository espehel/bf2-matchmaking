import { LiveInfo } from '@bf2-matchmaking/types';
import { info, logErrorMessage, logWarnMessage, warn } from '@bf2-matchmaking/logging';
import { getPlayerList, getServerInfo } from '../rcon/bf2-rcon-api';
import { getServer, setServerLiveInfo } from '@bf2-matchmaking/redis/servers';
import { DateTime } from 'luxon';
import { ServerStatus } from '@bf2-matchmaking/types/server';
import { ServerApi } from './server-api';
import dns from 'dns';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { parseError } from '@bf2-matchmaking/utils';
import { set } from '@bf2-matchmaking/redis/set';
import { hash } from '@bf2-matchmaking/redis/hash';
import { ServiceError } from '../error';
import { createRconsCache } from '../cache-service';
import { del, matchKeys } from '@bf2-matchmaking/redis/generic';
import { Server } from '@bf2-matchmaking/redis/types';

export async function createLiveInfo(
  address: string,
  shouldLog: boolean
): Promise<LiveInfo> {
  const { data: serverInfo, error, readyState } = await getServerInfo(address);
  if (error) {
    throw new Error(`${address}[${readyState}]: ${error.message}`);
  }

  const { data: players } =
    serverInfo.connectedPlayers === '0' ? { data: [] } : await getPlayerList(address);

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

export async function updateLiveServer(
  address: string,
  shouldLog: boolean = false
): Promise<LiveInfo | null> {
  const now = DateTime.now().toISO();

  let server = await getServer(address);
  if (server?.status === ServerStatus.RESTARTING) {
    try {
      server = await reinitServer(address);
    } catch (err) {
      return null;
    }
  }
  try {
    const live = await createLiveInfo(address, shouldLog);

    await ServerApi.update(address, {
      errorAt: undefined,
      updatedAt: now,
      status:
        server?.status === ServerStatus.OFFLINE ? ServerStatus.IDLE : server?.status,
    });
    return live;
  } catch (e) {
    if (!server?.errorAt) {
      await ServerApi.setError(address, e);
      return null;
    }
    if (DateTime.fromISO(server.errorAt).diffNow('hours').minutes < -30) {
      await ServerApi.setOffline(address, '30 minutes since last successful request');
    }
    warn(
      'updateLiveServer',
      `Server ${address}: Failed to update server: ${parseError(e)}`
    );
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

export async function resetServers() {
  try {
    await createRconsCache();
    const servers = await client().getServers().then(verifyResult);
    const serverData = await matchKeys('servers:*', (key) => !key.endsWith(':log'));
    const [
      deletedServerData,
      deletedIdleServers,
      deletedOfflineServers,
      deletedRestartingServers,
      deletedActiveServers,
    ] = await Promise.all([
      del(serverData),
      set('servers:idle').del(),
      set('servers:offline').del(),
      set('servers:restarting').del(),
      hash('servers:active').del(),
    ]);
    let offlineServers = 0;
    let idleServers = 0;

    for (const server of servers) {
      const newServer = await ServerApi.init(server);
      if (newServer?.status === ServerStatus.IDLE) {
        idleServers++;
      } else if (newServer?.status === ServerStatus.OFFLINE) {
        offlineServers++;
      }
    }

    return {
      deletedServerData,
      idleServers,
      offlineServers,
      deletedIdleServers,
      deletedOfflineServers,
      deletedRestartingServers,
      deletedActiveServers,
    };
  } catch (e) {
    logErrorMessage('Failed to reset servers', e);
    throw ServiceError.BadGateway('Failed to reset servers');
  }
}

export async function reinitServer(address: string) {
  info('reinitServer', `Reinitializing server ${address}`);
  const server = await getServer(address);
  if (!server) {
    throw new Error('Failed to get server');
  }
  if (server.status !== ServerStatus.RESTARTING) {
    logWarnMessage(`Server ${address}: status is not RESTARTING, cannot reinitialize`, {
      server,
    });
    return null;
  }
  const { error } = await getServerInfo(address);
  if (error) {
    throw new Error(error.message);
  }
  return client().getServer(address).then(verifySingleResult).then(ServerApi.init);
}

export async function getServerOrInit(address: string): Promise<Server> {
  const server = await ServerApi.get(address);
  if (server?.status === ServerStatus.IDLE || server?.status === ServerStatus.ACTIVE) {
    return server;
  }

  if (server?.status === ServerStatus.RESTARTING) {
    try {
      const restartedServer = await reinitServer(address);
      if (restartedServer && restartedServer.status !== ServerStatus.OFFLINE) {
        return restartedServer;
      }
    } catch (err) {}
  }

  const { data: newServer } = await client().getServer(address);
  if (!newServer) {
    throw ServiceError.InvalidRequest('Server does not exist');
  }
  const initializedServer = await ServerApi.init(newServer);
  if (!initializedServer) {
    throw ServiceError.InvalidRequest("Can't connect to server");
  }
  return initializedServer;
}
