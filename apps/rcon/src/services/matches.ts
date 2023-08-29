import { logChangeMatchStatus, logSupabaseError } from '@bf2-matchmaking/logging';
import {
  MatchesJoined,
  MatchStatus,
  RoundsInsert,
  RoundsRow,
  ServerInfo,
} from '@bf2-matchmaking/types';
import { client } from '@bf2-matchmaking/supabase';
import { LiveMatch } from './LiveMatch';

export const closeMatch = async (
  liveMatch: LiveMatch,
  reason: string,
  rounds: Array<RoundsRow>
) => {
  logChangeMatchStatus(
    MatchStatus.Closed,
    reason,
    liveMatch.match,
    rounds,
    liveMatch.liveRound
  );
  const { data, error } = await client().updateMatch(liveMatch.match.id, {
    status: MatchStatus.Closed,
  });
  if (error) {
    logSupabaseError('Failed to close match', error);
  }
  return data;
};

export const deleteMatch = async (
  liveMatch: LiveMatch,
  reason: string,
  rounds: Array<RoundsRow>
) => {
  logChangeMatchStatus(
    MatchStatus.Closed,
    reason,
    liveMatch.match,
    rounds,
    liveMatch.liveRound
  );
  const { data, error } = await client().updateMatch(liveMatch.match.id, {
    status: MatchStatus.Deleted,
  });
  if (error) {
    logSupabaseError('Failed to delete match', error);
  }
  return data;
};

export const hasPlayedAllRounds = (rounds: Array<RoundsInsert>) => rounds.length >= 4;

export const isServerEmptied = (rounds: Array<RoundsInsert>, si: ServerInfo) =>
  rounds.length > 0 && si.connectedPlayers === '0';

export const isFirstTimeFullServer = (
  match: MatchesJoined,
  si: ServerInfo,
  rounds: Array<RoundsInsert>
) => Number(si.connectedPlayers) === match.players.length && rounds.length === 0;

export const isOngoingRound = (si: ServerInfo) => {
  if (parseInt(si.roundTime) >= parseInt(si.timeLimit)) {
    return false;
  }

  if (parseInt(si.team1_tickets) === 0 || parseInt(si.team2_tickets) === 0) {
    return false;
  }

  return true;
};
