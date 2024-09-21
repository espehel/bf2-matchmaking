import { info, logErrorMessage, verbose } from '@bf2-matchmaking/logging';
import { isNotNull } from '@bf2-matchmaking/types';
import {
  addServerWithStatus,
  removeServerWithStatus,
} from '@bf2-matchmaking/redis/servers';
import { createServer } from '@bf2-matchmaking/services/server';
import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { createSockets } from '@bf2-matchmaking/services/rcon';
import { json } from '@bf2-matchmaking/redis/json';
import { AppEngineState } from '@bf2-matchmaking/types/engine';

export async function resetLiveServer(address: string) {
  verbose('resetLiveServer', `Server ${address}: Resetting...`);
  await removeServerWithStatus(address, 'active');
  await addServerWithStatus(address, 'idle');
  await json<AppEngineState>('app:engine:state').delProperty(address.replace('.', ''));
}

export const ACTIVE_SERVER_RATIO = 0.3;

export function isActiveMatchServer(serverPlayers: number, matchSize: number) {
  return serverPlayers / matchSize >= ACTIVE_SERVER_RATIO;
}

export async function initServers() {
  try {
    const servers = await client().getServers().then(verifyResult); //TODO use redis
    const connectedServers = (
      await createSockets(servers.map((s) => s.rcon).filter(isNotNull))
    ).filter(isNotNull);
    info(
      'initServers',
      `Connected ${connectedServers.length}/${servers.length} server sockets`
    );
    const serverStatuses = await Promise.all(
      servers.filter((s) => connectedServers.includes(s.ip)).map(createServer)
    );
    info('initServers', `Created ${serverStatuses.length} live servers`);
  } catch (e) {
    logErrorMessage('Failed to init live servers', e);
  }
}
