import {
  addActiveServer,
  getActiveMatchServer,
  getCachedMatchesJoined,
  getMatches,
  getMatchValues,
  getServersWithStatus,
  setServerLive,
  setServerValues,
} from '@bf2-matchmaking/redis';
import { buildLiveStateSafe } from '../services/server/servers';
import { DateTime } from 'luxon';
import { assertObj } from '@bf2-matchmaking/utils';
import { error, info } from '@bf2-matchmaking/logging';
import { LiveState, MatchesJoined } from '@bf2-matchmaking/types';
import { isServerIdentified, resetLiveServer } from '../services/server/server-manager';

export async function updateIdleServers() {
  info('updateIdleServers', 'Updating idle servers');
  try {
    const now = DateTime.utc().toISO();
    assertObj(now, 'Failed to get current time');
    let updatedServers = 0;

    const servers = await getServersWithStatus('idle');
    for (const address of servers) {
      const live = await buildLiveStateSafe(address);
      if (!live) {
        await setServerValues(address, { errorAt: now });
        continue;
      }
      await setServerValues(address, { errorAt: undefined, updatedAt: now });
      await setServerLive(address, live);
      updatedServers++;

      if (live.players.length === 0) {
        continue;
      }

      const matchId = await findPendingMatch(live);
      if (!matchId) {
        continue;
      }

      const currentAddress = await getActiveMatchServer(matchId);
      if (currentAddress) {
        await resetLiveServer(currentAddress);
      }
      info('updateIdleServers', `Server ${address} assigning to match ${matchId}`);
      await addActiveServer(address, matchId);
    }
    info(
      'updateIdleServers',
      `Updated ${updatedServers}/${servers.length} idle servers successfully`
    );
  } catch (e) {
    error('updateIdleServers', e);
  }
}

async function findPendingMatch(live: LiveState) {
  const matchList = await getMatches();
  for (const matchId of matchList) {
    try {
      const match = await getMatchValues(matchId);
      assertObj(match, 'Invalid state, match in matches set but not as a hash table');
      if (match.state !== 'pending') {
        continue;
      }

      const cachedMatch = await getCachedMatchesJoined(matchId);
      assertObj(cachedMatch, 'Invalid state, match in matches set but not cached');
      if (!isMatchServer(cachedMatch, live)) {
        continue;
      }
      return matchId;
    } catch (e) {
      error('findPendingMatch', e);
    }
  }
  return null;
}

function isMatchServer(match: MatchesJoined, live: LiveState) {
  const players = match.players;
  return isServerIdentified(
    players.filter((p) => live.players.some((sp) => sp.keyhash === p.keyhash)).length,
    players.length
  );
}
