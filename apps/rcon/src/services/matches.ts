import {
  info,
  logAddMatchRound,
  logChangeMatchStatus,
  logSupabaseError,
} from '@bf2-matchmaking/logging';
import {
  MatchesJoined,
  MatchStatus,
  PlayerListItem,
  PollServerStatus,
  RoundsInsert,
  RoundsRow,
  ServerInfo,
  ServerMatch,
} from '@bf2-matchmaking/types';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getPlayerList, PollServerInfoCb } from '../net/RconManager';
import { getLiveRound, removeLiveRound, updateLiveRound } from './round-service';

export const closeMatch = async (
  match: MatchesJoined,
  reason: string,
  si: ServerInfo | null = null,
  pl: Array<PlayerListItem> | null = null
) => {
  logChangeMatchStatus(MatchStatus.Closed, reason, match, si, pl);
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
  si: ServerInfo | null = null,
  pl: Array<PlayerListItem> | null = null
) => {
  logChangeMatchStatus(MatchStatus.Deleted, reason, match, si, pl);
  const { data, error } = await client().updateMatch(match.id, {
    status: MatchStatus.Deleted,
  });
  if (error) {
    logSupabaseError('Failed to delete match', error);
  }
  return data;
};

const pollStatusMap = new Map<number, PollServerStatus>();
export function onServerInfo(match: ServerMatch): PollServerInfoCb {
  const rounds: Array<RoundsRow> = [];
  let newRound = false;

  return async (si, rcon) => {
    if (hasPlayedAllRounds(rounds)) {
      await closeMatch(match, 'All rounds played', si);
      pollStatusMap.set(match.id, 'finished');
      return 'finished';
    }

    if (isServerEmptied(rounds, si)) {
      await closeMatch(match, 'Server emptied');
      pollStatusMap.set(match.id, 'finished');
      removeLiveRound(match);
      return 'finished';
    }

    if (!newRound && si.roundTime === '0') {
      info('onServerInfo', `New round`);
      newRound = true;
    }

    if (si.connectedPlayers === '0') {
      pollStatusMap.set(match.id, 'waiting');
      return 'waiting';
    }

    const pl = await getPlayerList(rcon);
    await updateLiveRound(match, si, pl);

    if (!newRound) {
      pollStatusMap.set(match.id, 'waiting');
      return 'waiting';
    }

    if (isOngoingRound(si)) {
      pollStatusMap.set(match.id, 'ongoing');
      return 'ongoing';
    }

    newRound = false;
    info('onServerInfo', `Round finished`);

    const liveRound = getLiveRound(match);
    if (liveRound) {
      const round = await client().createRound(liveRound).then(verifySingleResult);
      logAddMatchRound(round, match, si, pl);
      info('onServerInfo', `Created round ${round.id}`);
      rounds.push(round);
      removeLiveRound(match);
    }
    pollStatusMap.set(match.id, 'ongoing');
    return 'ongoing';
  };
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
