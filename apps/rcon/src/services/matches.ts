import {
  info,
  logAddMatchRound,
  logChangeMatchStatus,
  logSupabaseError,
} from '@bf2-matchmaking/logging';
import {
  MatchesJoined,
  MatchStatus,
  LiveServerState,
  RoundsInsert,
  RoundsRow,
  ServerInfo,
  ServerMatch,
  PlayerListItem,
} from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { LiveServerUpdate, PollServerInfoCb } from '../net/RconManager';
import { getLiveRound, removeLiveRound, updateLiveRound } from './round-service';
import { getPlayersToSwitch } from '@bf2-matchmaking/utils';

export const closeMatch = async (
  match: MatchesJoined,
  reason: string,
  rounds: Array<RoundsRow>
) => {
  logChangeMatchStatus(MatchStatus.Closed, reason, match, rounds, getLiveRound(match));
  const { data, error } = await client().updateMatch(match.id, {
    status: MatchStatus.Closed,
  });
  if (error) {
    logSupabaseError('Failed to close match', error);
  }
  return data;
};

export const deleteMatch = async (
  match: MatchesJoined,
  reason: string,
  rounds: Array<RoundsRow>
) => {
  logChangeMatchStatus(MatchStatus.Deleted, reason, match, rounds, getLiveRound(match));
  const { data, error } = await client().updateMatch(match.id, {
    status: MatchStatus.Deleted,
  });
  if (error) {
    logSupabaseError('Failed to delete match', error);
  }
  return data;
};

const pollStatusMap = new Map<number, LiveServerState>();
export function onServerInfo(match: ServerMatch): PollServerInfoCb {
  const rounds: Array<RoundsRow> = [];
  let state: LiveServerState = 'waiting';

  return async (si, pl) => {
    const liveRound = await updateLiveRound(match, si, pl);

    if (hasPlayedAllRounds(rounds)) {
      return next('finished');
    }

    if (isServerEmptied(rounds, si)) {
      return next('finished');
    }

    if (pl.length === 0) {
      return next('waiting');
    }

    if (state === 'waiting' || state === 'endlive') {
      return next('warmup');
    }

    if (state === 'warmup' && Number(si.connectedPlayers) === match.players.length) {
      return next('prelive');
    }

    if (state === 'prelive' && si.roundTime === '0') {
      return next('live');
    }

    if (isOngoingRound(si)) {
      return next('live');
    }

    if (liveRound) {
      const round = await client().createRound(liveRound).then(verifySingleResult);
      logAddMatchRound(round, match, si, pl);
      info('onServerInfo', `Created round ${round.id}`);
      rounds.push(round);
      removeLiveRound(match);
    }
    return next('endlive');
  };

  async function next(
    nextState: LiveServerState,
    pl?: Array<PlayerListItem>
  ): Promise<LiveServerUpdate> {
    updateState(nextState);

    if (nextState === 'finished') {
      await closeMatch(match, `New live state ${nextState}`, rounds);
    }
    if (nextState === 'prelive') {
      return { state: nextState, payload: pl ? getPlayersToSwitch(match, pl) : [] };
    }
    return { state: nextState, payload: null };
  }

  function updateState(nextState: LiveServerState) {
    state = nextState;
    pollStatusMap.set(match.id, nextState);
  }
}

const hasPlayedAllRounds = (rounds: Array<RoundsInsert>) => rounds.length >= 4;

const isServerEmptied = (rounds: Array<RoundsInsert>, si: ServerInfo) =>
  rounds.length > 0 && si.connectedPlayers === '0';

const isOngoingRound = (si: ServerInfo) => {
  if (parseInt(si.roundTime) >= parseInt(si.timeLimit)) {
    return false;
  }

  if (parseInt(si.team1_tickets) === 0 || parseInt(si.team2_tickets) === 0) {
    return false;
  }

  return true;
};

export function getPollStatus(matchId: number) {
  return pollStatusMap.get(matchId);
}
