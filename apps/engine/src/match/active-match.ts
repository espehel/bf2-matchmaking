import {
  LiveServerState,
  LiveInfo,
  MatchesJoined,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { info, logAddMatchRound, logChangeLiveState } from '@bf2-matchmaking/logging';
import { assertObj, formatSecToMin, hasKeyhash } from '@bf2-matchmaking/utils';

import { addTeamPlayerToLiveMatch } from './player-manager';
import { client } from '@bf2-matchmaking/supabase';
import {
  broadcastWarmUpStarted,
  hasPlayedAllRounds,
  isOngoingRound,
  isServerEmptied,
  isStale,
  setMatchLiveNow,
} from './match-manager';
import { insertRound } from './rounds-manager';
import { isActiveMatchServer } from '../server/server-manager';
import { DateTime } from 'luxon';
import {
  getMatch,
  getMatchLive,
  getPlayers,
  incMatchRoundsPlayed,
  setMatchLive,
  updatePlayers,
} from '@bf2-matchmaking/redis/matches';
import { syncMatchCache } from './match-manager';
import { MatchLive } from '@bf2-matchmaking/types/engine';

export async function updateMatch(
  cachedMatch: MatchesJoined,
  live: LiveInfo,
  address: string
): Promise<MatchLive> {
  const match = await getMatchLive(cachedMatch.id);
  logState(match, live, cachedMatch);
  await updatePlayers(cachedMatch.id, live);
  const nextState = await getNextState(cachedMatch, match, live);
  await handleNextState(match, nextState, cachedMatch, live, address);
  return getMatchLive(cachedMatch.id);
}

function logState(match: MatchLive, live: LiveInfo, cachedMatch: MatchesJoined) {
  info(
    'LiveMatch',
    `${formatSecToMin(live.roundTime)} (${live.team1_Name} ${live.team1_tickets} - ${
      live.team2_Name
    } ${live.team2_tickets}) [${live.players.length}/${cachedMatch.config.size} - ${
      match.state
    } - ${live.serverName}]`
  );
}

async function getNextState(
  cachedMatch: MatchesJoined,
  match: MatchLive,
  live: LiveInfo
): Promise<LiveServerState> {
  const players = await getPlayers(cachedMatch.id).then(Object.keys);

  if (hasPlayedAllRounds(cachedMatch.config, Number(match.roundsPlayed))) {
    return 'finished';
  }

  if (isServerEmptied(Number(match.roundsPlayed), live)) {
    return 'finished';
  }

  if (isStale(match)) {
    return 'stale';
  }

  if (!isActiveMatchServer(live.players.length, cachedMatch.config.size)) {
    return 'pending';
  }

  if (match.state === 'pending') {
    return 'warmup';
  }

  if (match.state === 'endlive') {
    return 'warmup';
  }

  if (match.state === 'prelive' && live.roundTime === '0') {
    return 'live';
  }

  if (match.state === 'warmup' && players.length < cachedMatch.config.size) {
    return 'warmup';
  }

  if (isOngoingRound(live)) {
    return 'live';
  }

  if (match.state !== 'live') {
    return match.state;
  }

  return 'endlive';
}
async function addRound(cachedMatch: MatchesJoined, live: LiveInfo, address: string) {
  const round = await insertRound(cachedMatch, live, address);
  logAddMatchRound(round, cachedMatch, live);
  info('onLiveServerUpdate', `Created round ${round.id}`);
  return incMatchRoundsPlayed(cachedMatch.id);
}

async function handleNextState(
  match: MatchLive,
  nextState: LiveServerState,
  cachedMatch: MatchesJoined,
  live: LiveInfo,
  address: string
) {
  if (nextState === 'pending' && match.state !== 'pending') {
    await setMatchLive(cachedMatch.id, {
      pendingSince: DateTime.utc().toISO(),
    });
  }
  if (nextState !== 'pending' && match.state === 'pending') {
    await setMatchLive(cachedMatch.id, { pendingSince: undefined });
  }

  if (match.state === 'pending' && nextState === 'warmup') {
    await broadcastWarmUpStarted(cachedMatch, address);
  }

  if (nextState === 'live' && !cachedMatch.live_at) {
    await setMatchLiveNow(cachedMatch.id);
  }

  if (nextState === 'endlive') {
    await addRound(cachedMatch, live, address);
  }

  if (match.state !== nextState) {
    logChangeLiveState(cachedMatch.id, match.state, nextState, live);
    await setMatchLive(cachedMatch.id, { state: nextState });
  }
}

export async function updateMatchPlayers(
  matchId: string,
  live: LiveInfo
): Promise<MatchesJoined> {
  let cachedMatch = await getMatch(matchId);
  assertObj(cachedMatch, `Match ${matchId} not cached`);

  let isDirty = false;
  for (const bf2Player of live.players) {
    if (bf2Player.getName.includes('STREAM')) {
      continue;
    }

    let player: PlayersRow | null | undefined = cachedMatch.players.find(
      hasKeyhash(bf2Player.keyhash)
    );

    if (!player) {
      player = await addTeamPlayerToLiveMatch(cachedMatch, bf2Player.keyhash);
      if (player) {
        isDirty = true;
      } else {
        continue;
      }
    }

    const connectedMp = cachedMatch.teams.find(
      (mp) => mp.player_id === player?.id && mp.connected_at
    );
    if (connectedMp) {
      continue;
    }

    const { data: mp } = await client().updateMatchPlayer(cachedMatch.id, player.id, {
      connected_at: DateTime.now().toISO(),
    });

    if (mp) {
      isDirty = true;
    }
  }

  if (isDirty) {
    cachedMatch = await syncMatchCache(matchId);
  }
  return cachedMatch;
}
