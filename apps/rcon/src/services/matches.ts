import {
  error,
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
  let isWaitingForNextRound = false;

  return async (si, rcon) => {
    if (hasPlayedAllRounds(rounds)) {
      await closeMatch(match, 'All rounds played', si);
      pollStatusMap.set(match.id, 'finished');
      return 'finished';
    }

    if (isServerEmptied(rounds, si)) {
      await closeMatch(match, 'Server emptied');
      pollStatusMap.set(match.id, 'finished');
      return 'finished';
    }

    if (si.connectedPlayers === '0') {
      pollStatusMap.set(match.id, 'waiting');
      return 'waiting';
    }

    const pl = await getPlayerList(rcon);
    await updateLiveRound(match, si, pl);

    if (isOngoingRound(si)) {
      isWaitingForNextRound = false;
      pollStatusMap.set(match.id, 'ongoing');
      return 'ongoing';
    }

    if (isWaitingForNextRound) {
      pollStatusMap.set(match.id, 'ongoing');
      return 'ongoing';
    }

    isWaitingForNextRound = true;
    info('onServerInfo', `Round finished`);

    const liveRound = getLiveRound(match);
    if (liveRound) {
      const round = await client().createRound(liveRound).then(verifySingleResult);
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

const createRound = async (
  match: MatchesJoined,
  si: ServerInfo,
  pl: Array<PlayerListItem> | null
): Promise<RoundsRow | null> => {
  if (!match.server?.ip) {
    error('createRound', `Match ${match.id} does not have assigned server`);
    return null;
  }

  const { data: map, error: mapError } = await client()
    .searchMap(si.currentMapName)
    .single();

  if (mapError) {
    logSupabaseError('Failed to create round, map search failed.', mapError);
    return null;
  }

  const newRound = {
    team1_name: si.team1_Name,
    team1_tickets: si.team1_tickets,
    team2_name: si.team2_Name,
    team2_tickets: si.team2_tickets,
    map: map.id,
    server: match.server.ip,
    match: match.id,
    si: JSON.stringify(si),
    pl: JSON.stringify(pl),
  };
  logAddMatchRound(newRound, match, si, pl);
  const { data: insertedRound, error: insertError } = await client().createRound(
    newRound
  );

  if (insertError) {
    logSupabaseError('Failed to insert round', insertError);
  }

  return insertedRound;
};

export function getPollStatus(matchId: number) {
  return pollStatusMap.get(matchId);
}
