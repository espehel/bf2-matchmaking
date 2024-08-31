import {
  getActiveMatchServers,
  getServerInfo,
  removeMatch,
} from '@bf2-matchmaking/redis';
import { DateTime } from 'luxon';
import { assertObj } from '@bf2-matchmaking/utils';
import { info, logChangeMatchStatus } from '@bf2-matchmaking/logging';
import { updateMatch, updateMatchPlayers } from '../services/match/active-match';
import { LiveState, MatchStatus } from '@bf2-matchmaking/types';
import { resetLiveServer, updateLiveServer } from '../services/server/server-manager';
import { saveDemosSince } from '@bf2-matchmaking/demo';
import { finishMatch } from '../services/match/matches';

export async function updateLiveServers() {
  const servers = await getActiveMatchServers();
  if (servers.size === 0) {
    info('updateLiveServers', `No live servers`);
    return;
  }

  for (const [matchId, address] of servers.entries()) {
    const liveState = await updateLiveServer(address);
    if (liveState) {
      await updateLiveMatch(address, matchId, liveState);
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

    const { data: server } = await getServerInfo(address);
    if (Number(match.roundsPlayed) > 0 && server?.demos_path && cachedMatch.started_at) {
      await saveDemosSince(address, cachedMatch.started_at, server.demos_path);
    }
  }
}
