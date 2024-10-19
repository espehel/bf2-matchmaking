import { info, logErrorMessage } from '@bf2-matchmaking/logging';
import { isNotNull } from '@bf2-matchmaking/types';
import { createSockets } from '@bf2-matchmaking/services/rcon';
import { hash } from '@bf2-matchmaking/redis/hash';
import { Server } from '@bf2-matchmaking/services/server/Server';

export const ACTIVE_SERVER_RATIO = 0.3;

export function isActiveMatchServer(serverPlayers: number, matchSize: number) {
  return serverPlayers / matchSize >= ACTIVE_SERVER_RATIO;
}

export async function initServers() {
  try {
    const servers = await hash<Record<string, string>>('cache:rcons').getAll();
    const connectedServers = (await createSockets(Object.entries(servers))).filter(
      isNotNull
    );
    info(
      'initServers',
      `Connected ${connectedServers.length}/${Object.keys(servers).length} server sockets`
    );
    const serverStatuses = await Promise.all(connectedServers.map(initServer));
    info(
      'initServers',
      `Initialized ${serverStatuses.filter(isNotNull).length}/${
        serverStatuses.length
      } live servers`
    );
  } catch (e) {
    logErrorMessage('Failed to init live servers', e);
  }
}

async function initServer(address: string) {
  try {
    return await Server.init(address);
  } catch (e) {
    return null;
  }
}
