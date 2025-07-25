import { parseError } from '@bf2-matchmaking/utils';
import { error, info, verbose } from '@bf2-matchmaking/logging';
import { LiveInfo, MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { isActiveMatchServer } from '../server/server-manager';
import { getServersWithStatus } from '@bf2-matchmaking/redis/servers';
import {
  getMatchLiveSafe,
  getWithStatus,
  initMatchLive,
  isMatchServer,
} from '@bf2-matchmaking/redis/matches';
import { updateLiveServer } from '@bf2-matchmaking/services/server';
import { json } from '@bf2-matchmaking/redis/json';
import { AppEngineState } from '@bf2-matchmaking/types/engine';
import { DateTime } from 'luxon';
import { Match } from '@bf2-matchmaking/redis/types';
import { Server } from '@bf2-matchmaking/services/server/Server';
import { ServerStatus } from '@bf2-matchmaking/types/server';
import { createJob } from '@bf2-matchmaking/scheduler';

async function updateIdleServers() {
  verbose('updateIdleServers', 'Updating idle servers');
  try {
    let updatedServers = 0;

    const servers = await getServersWithStatus(ServerStatus.IDLE);
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
    return updatedServers;
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
    await initMatchLive(match.id);
  }

  const currentServer = await Server.findByMatch(match.id);
  if (currentServer) {
    await Server.reset(currentServer);
  }
  await Server.setMatch(address, match.id);
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

export function scheduleIdleServersJob() {
  createJob('idleServers', updateIdleServers)
    .on('scheduled', (name, time) =>
      info(name, `Scheduled at ${DateTime.fromMillis(time).toFormat('D, TT')}`)
    )
    .on('started', (name, input) => info(name, `Started with input ${input}`))
    .on('failed', (name, err) => error(name, err))
    .on('finished', (name, output) =>
      info(name, `Finished with ${output} idle servers processed`)
    )
    .schedule({ interval: '30s' });
}
