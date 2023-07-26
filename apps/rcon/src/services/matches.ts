import { logChangeMatchStatus, logSupabaseError } from '@bf2-matchmaking/logging';
import {
  MatchesJoined,
  MatchStatus,
  PlayerListItem,
  ServerInfo,
} from '@bf2-matchmaking/types';
import { client } from '@bf2-matchmaking/supabase';

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
