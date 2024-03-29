import {
  DiscordConfig,
  DiscordMatch,
  MatchConfigsRow,
  MatchesJoined,
  MatchesRow,
  MatchPlayersInsert,
  MatchStatus,
  PickedMatchPlayer,
  PlayersRow,
  RatedMatchPlayer,
  ScheduledMatch,
  TeamsJoined,
  TeamspeakPlayer,
} from './database-types';
import { PostgrestError, TeamPlayer } from './index';

export const isMatchesRow = (row: unknown): row is MatchesRow => {
  const casted = row as MatchesRow;
  return Boolean(casted && casted.id && casted.status);
};
export const isDiscordConfig = (
  config: Partial<MatchConfigsRow>
): config is DiscordConfig => Boolean(config.channel);
export const isDiscordMatch = (match: MatchesJoined): match is DiscordMatch =>
  isDiscordConfig(match.config);

export const isScheduledMatch = (match: MatchesJoined): match is ScheduledMatch =>
  Boolean(match.status === MatchStatus.Scheduled && match.scheduled_at);

export const isTeamPlayer = (mp: MatchPlayersInsert): mp is TeamPlayer =>
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

export const isRatedMatchPlayer = (
  player: MatchPlayersInsert
): player is RatedMatchPlayer => typeof player.rating === 'number';
export const isPickedMatchPlayer = (
  player: MatchPlayersInsert
): player is PickedMatchPlayer => typeof player.team === 'number';

export function isTeamspeakPlayer(player: PlayersRow | null): player is TeamspeakPlayer {
  return Boolean(player && player.teamspeak_id);
}
