import {
  LiveServerState,
  LiveState,
  MatchesJoined,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { info, logAddMatchRound, logChangeLiveState } from '@bf2-matchmaking/logging';
import { assertObj, formatSecToMin, hasKeyhash } from '@bf2-matchmaking/utils';
import {
  getCachedMatchesJoined,
  getMatchValues,
  getMatchPlayers,
  setMatchPlayer,
  incMatchRoundsPlayed,
  setMatchValues,
  setCachedMatchesJoined,
} from '@bf2-matchmaking/redis';
import { addTeamPlayerToLiveMatch } from './players';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { DateTime } from 'luxon';
import {
  broadcastWarmUpStarted,
  hasPlayedAllRounds,
  isOngoingRound,
  isServerEmptied,
  setMatchLiveAt,
} from './matches';
import { insertRound } from './rounds';
import { Match } from '@bf2-matchmaking/redis/src/types';
import { isServerIdentified } from '../server/server-manager';

export async function updateMatch(
  cachedMatch: MatchesJoined,
  live: LiveState,
  address: string
): Promise<Match> {
  const match = await getMatchValues(cachedMatch.id);
  logState(match, live, cachedMatch);
  const nextState = getNextState(cachedMatch, match, live);
  await handleNextState(match, nextState, cachedMatch, live, address);
  const nextMatch = await getMatchValues(cachedMatch.id);
  return nextMatch;
}

function logState(match: Match, live: LiveState, cachedMatch: MatchesJoined) {
  info(
    'LiveMatch',
    `${formatSecToMin(live.roundTime)} (${live.team1_Name} ${live.team1_tickets} - ${
      live.team2_Name
    } ${live.team2_tickets}) [${live.players.length}/${cachedMatch.config.size} - ${
      match.state
    } - ${live.serverName}]`
  );
}

function getNextState(
  cachedMatch: MatchesJoined,
  match: Match,
  live: LiveState
): LiveServerState {
  if (hasPlayedAllRounds(cachedMatch.config, Number(match.roundsPlayed))) {
    return 'finished';
  }

  if (isServerEmptied(Number(match.roundsPlayed), live)) {
    return 'finished';
  }

  if (!isServerIdentified(live.players.length, cachedMatch.config.size)) {
    return 'pending';
  }

  if (
    match.state === 'pending' &&
    isServerIdentified(live.players.length, cachedMatch.config.size)
  ) {
    return 'warmup';
  }

  if (match.state === 'endlive') {
    return 'warmup';
  }

  if (match.state === 'prelive' && live.roundTime === '0') {
    return 'live';
  }

  if (
    match.state === 'warmup' &&
    Number(live.players.length) !== cachedMatch.config.size
  ) {
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
async function addRound(cachedMatch: MatchesJoined, live: LiveState, address: string) {
  const round = await insertRound(cachedMatch, live, address);
  logAddMatchRound(round, cachedMatch, live);
  info('onLiveServerUpdate', `Created round ${round.id}`);
  return incMatchRoundsPlayed(cachedMatch.id);
}

async function handleNextState(
  match: Match,
  nextState: LiveServerState,
  cachedMatch: MatchesJoined,
  live: LiveState,
  address: string
) {
  if (nextState === 'pending' && match.state !== 'pending') {
    await setMatchValues(cachedMatch.id, {
      ...match,
      pendingSince: DateTime.utc().toISO(),
    });
  }
  if (nextState !== 'pending' && match.state === 'pending') {
    await setMatchValues(cachedMatch.id, { ...match, pendingSince: null });
  }

  if (match.state === 'pending' && nextState === 'warmup') {
    await broadcastWarmUpStarted(cachedMatch, address);
  }

  if (nextState === 'live' && !match.live_at) {
    await setMatchLiveAt(cachedMatch.id, match);
  }

  if (nextState === 'endlive') {
    await addRound(cachedMatch, live, address);
  }

  if (match.state !== nextState) {
    logChangeLiveState(cachedMatch.id, match.state, nextState, live);
    await setMatchValues(cachedMatch.id, { ...match, state: nextState });
  }
}

export async function updateMatchPlayers(
  matchId: string,
  live: LiveState
): Promise<MatchesJoined> {
  let cachedMatch = await getCachedMatchesJoined(matchId);
  if (!cachedMatch) {
    info('updateMatchPlayers', `Match ${matchId}: Creating match cache`);
    cachedMatch = await client().getMatch(Number(matchId)).then(verifySingleResult);
  }
  assertObj(cachedMatch, 'Failed to cache MatchesJoined');

  let isDirty = false;
  const connectedPlayers = await getMatchPlayers(matchId);
  for (const bf2Player of live.players) {
    if (connectedPlayers.includes(bf2Player.keyhash)) {
      continue;
    }
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
      await setMatchPlayer(matchId, bf2Player.keyhash);
      isDirty = true;
    }
  }

  if (isDirty) {
    const updatedMatch = await client()
      .getMatch(Number(matchId))
      .then(verifySingleResult);
    await setCachedMatchesJoined(updatedMatch);
    cachedMatch = updatedMatch;
  }
  return cachedMatch;
}
