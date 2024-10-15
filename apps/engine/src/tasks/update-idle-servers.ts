import { parseError } from '@bf2-matchmaking/utils';
import { error, info, verbose } from '@bf2-matchmaking/logging';
import { LiveInfo, MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { isActiveMatchServer, resetLiveServer } from '../server/server-manager';
import {
  addActiveMatchServer,
  getActiveMatchServer,
  getServersWithStatus,
  removeServerWithStatus,
} from '@bf2-matchmaking/redis/servers';
import {
  getMatchLiveSafe,
  getWithStatus,
  isMatchServer,
} from '@bf2-matchmaking/redis/matches';
import { updateLiveServer } from '@bf2-matchmaking/services/server';
import { json } from '@bf2-matchmaking/redis/json';
import { AppEngineState } from '@bf2-matchmaking/types/engine';
import { DateTime } from 'luxon';
import cron from 'node-cron';
import { createPendingLiveMatch } from '@bf2-matchmaking/services/matches';
import { Match } from '@bf2-matchmaking/redis/types';

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
      await handleActiveMatchServer(address, liveState);
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

async function handleActiveMatchServer(address: string, liveState: LiveInfo) {
  if (liveState.players.length === 0) {
    return;
  }

  let [match, liveMatch] = await findOngoingMatch(address, liveState);
  if (!match) {
    return;
  }
  if (!liveMatch) {
    await createPendingLiveMatch(match);
  }

  const currentServer = await getActiveMatchServer(match.id.toString());
  if (currentServer) {
    await resetLiveServer(currentServer);
  }
  info('handleActiveMatchServer', `Server ${address} assigning to match ${match.id}`);
  await addActiveMatchServer(address, match.id.toString());
  await removeServerWithStatus(address, 'idle');
}

async function findOngoingMatch(
  address: string,
  live: LiveInfo
): Promise<[MatchesJoined | null, Match | null]> {
  const matches = await getWithStatus(MatchStatus.Ongoing);
  for (const match of matches) {
    const liveMatch = await getMatchLiveSafe(match.id);
    if (liveMatch && liveMatch.state !== 'pending') {
      continue;
    }

    if (await hasMatchPlayers(address, match, live)) {
      return [match, liveMatch];
    }
  }

  return [null, null];
}

async function hasMatchPlayers(address: string, match: MatchesJoined, live: LiveInfo) {
  const playerKeyhashes = match.players.map((p) => p.keyhash);
  if (await isMatchServer(match.id, address)) {
    playerKeyhashes
      .concat(match.home_team.players.map((p) => p.player.keyhash))
      .concat(match.away_team.players.map((p) => p.player.keyhash));
  }

  return isActiveMatchServer(
    playerKeyhashes.filter((keyhash) => live.players.some((sp) => sp.keyhash === keyhash))
      .length,
    match.config.size
  );
}

export const updateIdleServersTask = cron.schedule('*/30 * * * * *', updateIdleServers, {
  scheduled: false,
});
