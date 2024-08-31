import {
  addActiveMatchServer,
  get,
  getActiveMatchServer,
  getHash,
  getMatches,
  getServersWithStatus,
} from '@bf2-matchmaking/redis';
import { assertObj } from '@bf2-matchmaking/utils';
import { error, info, warn } from '@bf2-matchmaking/logging';
import { LiveState, MatchesJoined } from '@bf2-matchmaking/types';
import {
  isServerIdentified,
  resetLiveServer,
  updateLiveServer,
} from '../services/server/server-manager';
import { validateMatch } from '@bf2-matchmaking/redis/src/validate';

export async function updateIdleServers() {
  info('updateIdleServers', 'Updating idle servers');
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
    info(
      'updateIdleServers',
      `Updated ${updatedServers}/${servers.length} idle servers successfully`
    );
  } catch (e) {
    error('updateIdleServers', e);
  }
}

async function handlePendingMatch(address: string, liveState: LiveState) {
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
}

async function findPendingMatch(live: LiveState) {
  const matchList = await getMatches();
  for (const matchId of matchList) {
    try {
      const match = await getHash('match', matchId).then(validateMatch);
      assertObj(match, 'Invalid state, match in matches set but not as a hash table');
      if (match.state !== 'pending') {
        continue;
      }

      const { data: cachedMatch } = await get<MatchesJoined>(`match:${matchId}:cache`);
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

function isMatchServer(match: MatchesJoined, live: LiveState) {
  const players = match.players;
  return isServerIdentified(
    players.filter((p) => live.players.some((sp) => sp.keyhash === p.keyhash)).length,
    players.length
  );
}
