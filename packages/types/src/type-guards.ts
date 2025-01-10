import {
  AcceptedChallenge,
  Challenge,
  DiscordConfig,
  DiscordMatch,
  MatchConfigsRow,
  MatchesJoined,
  MatchesRow,
  MatchPlayersInsert,
  MatchServersRow,
  MatchStatus,
  PendingChallenge,
  PickedMatchPlayer,
  PlayersRow,
  RatedMatchPlayer,
  ScheduledMatch,
  StartedMatch,
  TeamsJoined,
  TeamspeakPlayer,
} from './database-types';
import {
  ActiveLiveMatch,
  LiveMatch,
  PostgrestError,
  PubobotMatch,
  TeamPlayer,
} from './index';
import { ConnectedLiveServer, LiveServer, OfflineServer, ServerStatus } from './server';

export const isMatchesRow = (row: unknown): row is MatchesRow => {
  const casted = row as MatchesRow;
  return Boolean(casted && casted.id && casted.status);
};
export const isMatchServersRow = (row: unknown): row is MatchServersRow => {
  const server = row as MatchServersRow;
  return Boolean(server && server.server && server.id);
};
export const isDiscordConfig = (
  config: Partial<MatchConfigsRow>
): config is DiscordConfig => Boolean(config.channel);
export const isDiscordMatch = (match: MatchesJoined): match is DiscordMatch =>
  isDiscordConfig(match.config);

export const isScheduledMatch = (match: MatchesJoined): match is ScheduledMatch =>
  Boolean(match.status === MatchStatus.Scheduled && match.scheduled_at);

export const isStartedMatch = (match: MatchesJoined): match is StartedMatch =>
  Boolean(match.started_at);

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
export const isNull = (object: unknown): object is null => object === null;

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

export function isPendingChallenge(challenge: Challenge): challenge is PendingChallenge {
  return challenge.status === 'pending' && challenge.away_team !== null;
}

export function isAcceptedChallenge(
  challenge: Challenge | null
): challenge is AcceptedChallenge {
  return challenge
    ? challenge.status === 'accepted' &&
        challenge.away_team !== null &&
        challenge.away_map !== null &&
        challenge.away_server !== null &&
        challenge.match !== null
    : false;
}

export function isConnectedLiveServer(server: LiveServer): server is ConnectedLiveServer {
  return (
    (server.status === ServerStatus.ACTIVE || server.status === ServerStatus.IDLE) &&
    server.live !== null &&
    server.data !== null
  );
}

export function isOfflineLiveServer(server: LiveServer): server is OfflineServer {
  return (
    (server.status === ServerStatus.OFFLINE ||
      server.status === ServerStatus.RESTARTING) &&
    !server.live &&
    !server.data
  );
}

export function isActiveLiveMatch(match: LiveMatch): match is ActiveLiveMatch {
  return Boolean(match.server);
}

export function isPubobotMatch(value: unknown): value is PubobotMatch {
  return Boolean(value && (value as PubobotMatch).matchId);
}
