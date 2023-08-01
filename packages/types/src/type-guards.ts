import {
  DiscordConfig,
  DiscordMatch,
  MatchConfigsRow,
  MatchesJoined,
  MatchPlayersRow,
} from './database-types';
import { PostgrestError, TeamPlayer } from './index';

export const isDiscordConfig = (
  config: Partial<MatchConfigsRow>
): config is DiscordConfig => Boolean(config.channel);
export const isDiscordMatch = (match: MatchesJoined): match is DiscordMatch =>
  isDiscordConfig(match.config);

export const isTeamPlayer = (mp: MatchPlayersRow): mp is TeamPlayer =>
  Boolean((mp as TeamPlayer).player);

export const isPostgrestError = (error: unknown): error is PostgrestError => {
  const pgError = error as PostgrestError;
  return Boolean(pgError && pgError.code && pgError.message && pgError.hint);
};

export const isDefined = <T>(object: undefined | T): object is T =>
  typeof object !== 'undefined';

export const isNotNull = <T>(object: null | T): object is T => object !== null;
