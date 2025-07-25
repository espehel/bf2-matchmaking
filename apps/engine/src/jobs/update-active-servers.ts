import { error, info, verbose } from '@bf2-matchmaking/logging';
import { updateMatch, updateMatchPlayers } from '../match/active-match';
import { isStartedMatch, LiveInfo } from '@bf2-matchmaking/types';
import { getActiveMatchServers } from '@bf2-matchmaking/redis/servers';
import { removeLiveMatch } from '@bf2-matchmaking/redis/matches';
import { saveMatchDemos } from '../services/demo-service';
import { updateLiveServer } from '@bf2-matchmaking/services/server';
import { json } from '@bf2-matchmaking/redis/json';
import { AppEngineState } from '@bf2-matchmaking/types/engine';
import { DateTime } from 'luxon';
import { parseError } from '@bf2-matchmaking/utils';
import { Server } from '@bf2-matchmaking/services/server/Server';
import { createJob } from '@bf2-matchmaking/scheduler';
import { matchService } from '../lib/match';

async function updateActiveServers() {
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
  return servers.length;
}

async function updateLiveMatch(address: string, matchId: string, live: LiveInfo) {
  try {
    const cachedMatch = await updateMatchPlayers(matchId, live);
    const match = await updateMatch(cachedMatch, live, address);

    if (match.state === 'stale') {
      info('updateLiveMatch', `No players connected, resetting ${address}`);
      await Server.reset(address);
    }

    if (match.state === 'finished') {
      await matchService.finishMatch(matchId);
      await removeLiveMatch(matchId);
      await Server.reset(address);

      const server = await Server.getData(address);
      if (Number(match.roundsPlayed) > 0 && isStartedMatch(cachedMatch)) {
        await saveMatchDemos(address, cachedMatch, server);
      }
      return;
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

export function scheduleActiveServersJob() {
  createJob('activeServers', updateActiveServers)
    .on('failed', (name, err) => error(name, err))
    .on('finished', (name, output) => {
      if (output) {
        info(name, `Finished with ${output} active servers processed`);
      }
    })
    .schedule({ interval: '10s' });
}
