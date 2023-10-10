import {
  DiscordConfig,
  DiscordMatch,
  MatchConfigsRow,
  MatchesJoined,
  MatchPlayersRow,
  MatchStatus,
  ScheduledMatch,
  ServerMatch,
  TeamsJoined,
  TeamsRow,
} from './database-types';
import { PostgrestError, TeamPlayer } from './index';

export const isDiscordConfig = (
  config: Partial<MatchConfigsRow>
): config is DiscordConfig => Boolean(config.channel);
export const isDiscordMatch = (match: MatchesJoined): match is DiscordMatch =>
  isDiscordConfig(match.config);

export const isServerMatch = (match: MatchesJoined): match is ServerMatch =>
  Boolean(match.server);

export const isScheduledMatch = (match: MatchesJoined): match is ScheduledMatch =>
  Boolean(match.status === MatchStatus.Scheduled && match.scheduled_at);

export const isTeamPlayer = (mp: MatchPlayersRow): mp is TeamPlayer =>
  Boolean((mp as TeamPlayer).player);

export const isTeamsJoined = (team: unknown): team is TeamsJoined => {
  const tj = team as TeamsJoined;
  return Boolean(tj.owner && tj.players && tj.captains);
};

export const isPostgrestError = (error: unknown): error is PostgrestError => {
  const pgError = error as PostgrestError;
  return Boolean(pgError && pgError.code && pgError.message && pgError.hint);
};

export const isDefined = <T>(object: undefined | T): object is T =>
  typeof object !== 'undefined';

export const isNotNull = <T>(object: null | T): object is T => object !== null;

export const isString = (text: unknown): text is string => typeof text === 'string';

export const isTruthy = <T>(object: undefined | null | T): object is T => Boolean(object);
