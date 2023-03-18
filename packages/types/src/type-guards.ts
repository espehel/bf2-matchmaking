import {
  DiscordConfig,
  DiscordMatch,
  MatchConfigsRow,
  MatchesJoined,
} from './database-types';
import { PostgrestError } from './index';

export const isDiscordConfig = (
  config: Partial<MatchConfigsRow>
): config is DiscordConfig => Boolean(config.channel);
export const isDiscordMatch = (match: MatchesJoined): match is DiscordMatch =>
  isDiscordConfig(match.config);

export const isPostgrestError = (error: unknown): error is PostgrestError => {
  const pgError = error as PostgrestError;
  return Boolean(pgError && pgError.code && pgError.message && pgError.hint);
};

export const isDefined = <T>(object: undefined | T): object is T =>
  typeof object !== 'undefined';
