import {
  getServerInfo,
  getServersWithStatus,
  getServerValues,
  setServerLive,
  setServerValues,
} from '@bf2-matchmaking/redis';
import { buildLiveState } from '../services/server/servers';
import { DateTime } from 'luxon/src/datetime';
import { assertObj } from '@bf2-matchmaking/utils';
import { error, info } from '@bf2-matchmaking/logging';
import { updateMatch } from '../services/match/active-match';
import { LiveState } from '@bf2-matchmaking/types';
import { resetLiveServer } from '../services/server/server-manager';
import { saveDemosSince } from '@bf2-matchmaking/demo';

export async function updateLiveServers() {
  const now = DateTime.utc().toISO();
  assertObj(now, 'Failed to get current time');

  const servers = await getServersWithStatus('live');
  if (servers.length === 0) {
    return;
  }
  for (const address of servers) {
    try {
      await setServerValues(address, { tickedAt: now });
      const values = await getServerValues(address);
      const live = await buildLiveState(address);
      await setServerValues(address, { errorAt: undefined, updatedAt: now });
      await setServerLive(address, live);
      if (values.matchId) {
        // TODO: live server without match, change state?
        await updateLiveMatch(address, values.matchId, live);
      }
    } catch (e) {
      await setServerValues(address, { errorAt: now });
      error('updateLiveServers', e);
    }
  }
}

async function updateLiveMatch(address: string, matchId: string, live: LiveState) {
  const [state, match, rounds] = await updateMatch(matchId, live);

  if (state === 'stale') {
    info('updateLiveMatch', `No players connected, resetting ${address}`);
    await resetLiveServer(address);
  }

  if (state === 'finished') {
    await resetLiveServer(address);
    const server = await getServerInfo(address);
    if (rounds.length > 0 && server.demos_path && match.started_at) {
      await saveDemosSince(address, match.started_at, server.demos_path);
    }
  }
}
