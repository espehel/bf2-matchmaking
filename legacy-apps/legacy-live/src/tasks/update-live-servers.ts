import { get, getActiveMatchServers, removeMatch } from '@bf2-matchmaking/redis';
import { error, info, logChangeMatchStatus } from '@bf2-matchmaking/logging';
import { updateMatch, updateMatchPlayers } from '../services/match/active-match';
import { LiveState, MatchStatus } from '@bf2-matchmaking/types';
import { resetLiveServer, updateLiveServer } from '../services/server/server-manager';
import { saveDemosSince } from '@bf2-matchmaking/demo';
import { finishMatch } from '../services/match/matches';
import { validateServerInfoSafe } from '@bf2-matchmaking/redis/src/validate';

export async function updateLiveServers() {
  const servers = await getActiveMatchServers().then(Object.entries);
  if (servers.length === 0) {
    info('updateLiveServers', `No live servers`);
    return;
  }

  for (const [matchId, address] of servers) {
    const liveState = await updateLiveServer(address);
    if (liveState) {
      await updateLiveMatch(address, matchId, liveState);
    }
  }
}

async function updateLiveMatch(address: string, matchId: string, live: LiveState) {
  try {
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

      const server = await get(`server:${address}:info`).then(validateServerInfoSafe);
      if (
        Number(match.roundsPlayed) > 0 &&
        server?.demos_path &&
        cachedMatch.started_at
      ) {
        await saveDemosSince(address, cachedMatch.started_at, server.demos_path);
      }
    }
  } catch (e) {
    error(`updateLiveMatch ${address} ${matchId}`, e);
  }
}
