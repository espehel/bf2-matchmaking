import {
  getActiveMatchServers,
  getServerInfo,
  getServersWithStatus,
  getServerValues,
  removeMatch,
  setServerLive,
  setServerValues,
} from '@bf2-matchmaking/redis';
import { buildLiveState } from '../services/server/servers';
import { DateTime } from 'luxon/src/datetime';
import { assertObj } from '@bf2-matchmaking/utils';
import { error, info, logChangeMatchStatus, warn } from '@bf2-matchmaking/logging';
import { updateMatch, updateMatchPlayers } from '../services/match/active-match';
import { LiveState, MatchStatus } from '@bf2-matchmaking/types';
import { resetLiveServer } from '../services/server/server-manager';
import { saveDemosSince } from '@bf2-matchmaking/demo';
import { finishMatch } from '../services/match/matches';

export async function updateLiveServers() {
  const now = DateTime.utc().toISO();
  assertObj(now, 'Failed to get current time');

  const servers = await getActiveMatchServers();
  if (servers.size === 0) {
    info('updateLiveServers', `No live servers`);
    return;
  }
  for (const [matchId, address] of servers.entries()) {
    try {
      await setServerValues(address, { tickedAt: now });

      const live = await buildLiveState(address);
      await setServerValues(address, { errorAt: undefined, updatedAt: now });
      await setServerLive(address, live);

      await updateLiveMatch(address, matchId, live);
    } catch (e) {
      await setServerValues(address, { errorAt: now });
      error('updateLiveServers', e);
    }
  }
}

async function updateLiveMatch(address: string, matchId: string, live: LiveState) {
  const cachedMatch = await updateMatchPlayers(matchId, live);
  const match = await updateMatch(cachedMatch, live, address);

  if (match.state === 'stale') {
    info('updateLiveMatch', `No players connected, resetting ${address}`);
    await resetLiveServer(address);
  }

  if (match.state === 'finished') {
    logChangeMatchStatus(MatchStatus.Finished, matchId, { match, live, cachedMatch });
    await finishMatch(matchId);
    await removeMatch(matchId);
    await resetLiveServer(address);

    const server = await getServerInfo(address);
    if (match.roundsPlayed > 0 && server.demos_path && cachedMatch.started_at) {
      await saveDemosSince(address, cachedMatch.started_at, server.demos_path);
    }
  }
}
