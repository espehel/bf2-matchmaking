import { info, logErrorMessage } from '@bf2-matchmaking/logging';
import { isNotNull } from '@bf2-matchmaking/types';
import { createSockets } from '@bf2-matchmaking/services/rcon';
import { hash } from '@bf2-matchmaking/redis/hash';
import { Server } from '@bf2-matchmaking/services/server/Server';
import { set } from '@bf2-matchmaking/redis/set';

export const ACTIVE_SERVER_RATIO = 0.3;

export function isActiveMatchServer(serverPlayers: number, matchSize: number) {
  return serverPlayers / matchSize >= ACTIVE_SERVER_RATIO;
}

export async function initServers() {
  try {
    const servers = await hash<Record<string, string>>('cache:rcons').keys();
    await Promise.all([
      set('servers:idle').del(),
      set('servers:offline').del(),
      set('servers:restarting').del(),
      hash('servers:active').del(),
    ]);

    let initializedServers = 0;
    for (const server of servers) {
      const initializedServer = await initServer(server);
      if (initializedServer) {
        initializedServers++;
      }
    }

    info(
      'initServers',
      `Initialized ${initializedServers}/${servers.length} live servers`
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
