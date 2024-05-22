import {
  getServersWithStatus,
  setServerLive,
  setServerValues,
} from '@bf2-matchmaking/redis';
import { buildLiveStateSafe } from '../services/server/servers';
import { DateTime } from 'luxon/src/datetime';
import { assertObj } from '@bf2-matchmaking/utils';
import { info } from '@bf2-matchmaking/logging';

export async function updateIdleServers() {
  const now = DateTime.utc().toISO();
  assertObj(now, 'Failed to get current time');
  let updatedServers = 0;

  const servers = await getServersWithStatus('idle');
  for (const address of servers) {
    const live = await buildLiveStateSafe(address);
    if (!live) {
      setServerValues(address, { errorAt: now });
      continue;
    }
    await setServerValues(address, { errorAt: undefined, updatedAt: now });
    await setServerLive(address, live);
    updatedServers++;
  }
  info(
    'updateIdleServers',
    `Updated ${updatedServers}/${servers.length} idle servers successfully`
  );
}
