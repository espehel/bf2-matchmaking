import { info, logErrorMessage } from '@bf2-matchmaking/logging';
import { isNotNull } from '@bf2-matchmaking/types';
import { createSockets } from '@bf2-matchmaking/services/rcon';
import { hash } from '@bf2-matchmaking/redis/hash';
import { Server } from '@bf2-matchmaking/services/server/Server';
import { set } from '@bf2-matchmaking/redis/set';
import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { verify } from '@bf2-matchmaking/utils';

export const ACTIVE_SERVER_RATIO = 0.3;

export function isActiveMatchServer(serverPlayers: number, matchSize: number) {
  return serverPlayers / matchSize >= ACTIVE_SERVER_RATIO;
}

export async function initServers() {
  try {
    const servers = await client().getServers().then(verifyResult);
    await Promise.all([
      set('servers:idle').del(),
      set('servers:offline').del(),
      set('servers:restarting').del(),
      hash('servers:active').del(),
    ]);

    for (const server of servers) {
      await Server.init(server);
    }

    info('initServers', `Initialized ${servers.length} live servers`);
  } catch (e) {
    logErrorMessage('Failed to init live servers', e);
  }
}
