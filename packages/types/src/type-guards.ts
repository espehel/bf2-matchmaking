import { DiscordMatch, MatchesJoined } from './database-types';
import { PostgrestError } from './index';

export const isDiscordMatch = (match: MatchesJoined): match is DiscordMatch =>
  Boolean(match.channel);

export const isPostgrestError = (error: unknown): error is PostgrestError => {
  const pgError = error as PostgrestError;
  return Boolean(pgError && pgError.code && pgError.message && pgError.hint);
};
