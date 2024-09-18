import { error, info, logChangeMatchStatus, verbose } from '@bf2-matchmaking/logging';
import { updateMatch, updateMatchPlayers } from '../match/active-match';
import { LiveInfo, MatchStatus } from '@bf2-matchmaking/types';
import { resetLiveServer } from '../server/server-manager';
import { getActiveMatchServers, getServer } from '@bf2-matchmaking/redis/servers';
import { removeLiveMatch } from '@bf2-matchmaking/redis/matches';
import { saveDemosSince } from '../services/demo-service';
import { finishMatch } from '@bf2-matchmaking/services/matches';
import { updateLiveServer } from '@bf2-matchmaking/services/server';
import { json } from '@bf2-matchmaking/redis/json';
import { AppEngineState } from '@bf2-matchmaking/types/engine';
import { DateTime } from 'luxon';
import { parseError } from '@bf2-matchmaking/utils';
import cron from 'node-cron';

async function updateLiveServers() {
  const servers = await getActiveMatchServers().then(Object.entries<string>);
  if (servers.length === 0) {
    verbose('updateLiveServers', `No live servers`);
    return;
  }

  for (const [matchId, address] of servers) {
    const liveState = await updateLiveServer(address);
    if (liveState) {
      await updateLiveMatch(address, matchId, liveState);
    }
  }
}

async function updateLiveMatch(address: string, matchId: string, live: LiveInfo) {
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
      await removeLiveMatch(matchId);
      await resetLiveServer(address);

      const server = await getServer(address);
      if (
        Number(match.roundsPlayed) > 0 &&
        server?.demos_path &&
        cachedMatch.started_at
      ) {
        await saveDemosSince(address, cachedMatch.started_at, server.demos_path);
      }
    }

    await json<AppEngineState>('app:engine:state').setProperty(address.replace('.', ''), {
      status: 'ok',
      error: null,
      updatedAt: DateTime.now().toISO(),
      matchId,
      ...match,
    });
  } catch (e) {
    error(`updateLiveMatch ${address} ${matchId}`, e);
    await json<AppEngineState>('app:engine:state').setProperty(address.replace('.', ''), {
      status: 'error',
      error: parseError(e),
      updatedAt: DateTime.now().toISO(),
      matchId,
    });
  }
}

export const updateLiveServersTask = cron.schedule('*/10 * * * * *', updateLiveServers, {
  scheduled: false,
});
