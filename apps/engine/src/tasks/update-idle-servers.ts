import { assertObj, parseError } from '@bf2-matchmaking/utils';
import { error, info, verbose, warn } from '@bf2-matchmaking/logging';
import { LiveInfo, MatchesJoined } from '@bf2-matchmaking/types';
import { isServerIdentified, resetLiveServer } from '../server/server-manager';
import {
  addActiveMatchServer,
  getActiveMatchServer,
  getServersWithStatus,
  removeServerWithStatus,
} from '@bf2-matchmaking/redis/servers';
import { getMatch, getMatchesLive, getMatchLive } from '@bf2-matchmaking/redis/matches';
import { updateLiveServer } from '@bf2-matchmaking/services/server';
import { json } from '@bf2-matchmaking/redis/json';
import { AppEngineState } from '@bf2-matchmaking/types/engine';
import { DateTime } from 'luxon';
import cron from 'node-cron';

async function updateIdleServers() {
  verbose('updateIdleServers', 'Updating idle servers');
  try {
    let updatedServers = 0;

    const servers = await getServersWithStatus('idle');
    for (const address of servers) {
      const liveState = await updateLiveServer(address);
      if (!liveState) {
        continue;
      }
      updatedServers++;
      await handlePendingMatch(address, liveState);
    }
    verbose(
      'updateIdleServers',
      `Updated ${updatedServers}/${servers.length} idle servers successfully`
    );
    await json<AppEngineState>('app:engine:state').setProperty('idleServerTask', {
      status: 'ok',
      error: null,
      updated: updatedServers,
      updatedAt: DateTime.now().toISO(),
    });
  } catch (e) {
    error('updateIdleServers', e);
    await json<AppEngineState>('app:engine:state').setProperty('idleServerTask', {
      status: 'error',
      error: parseError(e),
      updated: null,
      updatedAt: DateTime.now().toISO(),
    });
  }
}

async function handlePendingMatch(address: string, liveState: LiveInfo) {
  if (liveState.players.length === 0) {
    return;
  }

  const matchId = await findPendingMatch(liveState);
  if (!matchId) {
    return;
  }

  const currentServer = await getActiveMatchServer(matchId);
  if (currentServer) {
    await resetLiveServer(currentServer);
  }
  info('handlePendingMatch', `Server ${address} assigning to match ${matchId}`);
  await addActiveMatchServer(address, matchId);
  await removeServerWithStatus(address, 'idle');
}

async function findPendingMatch(live: LiveInfo) {
  const matchList = await getMatchesLive();
  for (const matchId of matchList) {
    try {
      const match = await getMatchLive(matchId);
      assertObj(match, 'Invalid state, match in matches set but not as a hash table');
      if (match.state !== 'pending') {
        continue;
      }

      const cachedMatch = await getMatch(matchId);
      if (!cachedMatch) {
        warn('findPendingMatch', `Match ${matchId} not found in cache`);
        continue;
      }
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

function isMatchServer(match: MatchesJoined, live: LiveInfo) {
  const players = match.players;
  return isServerIdentified(
    players.filter((p) => live.players.some((sp) => sp.keyhash === p.keyhash)).length,
    players.length
  );
}

export const updateIdleServersTask = cron.schedule('*/30 * * * * *', updateIdleServers, {
  scheduled: false,
});
