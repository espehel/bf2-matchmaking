import {
  DraftStep,
  isDefined,
  isNotNull,
  MatchesJoined,
  MatchesRow,
  MatchResult,
  MatchStatus,
  PlayerListItem,
  PlayersRow,
  RoundsJoined,
} from '@bf2-matchmaking/types';

export const isAssignedTeam = (
  match: MatchesJoined,
  playerId: string,
  team: 'a' | 'b' | null
) => match.teams.some((player) => player.player_id === playerId && player.team === team);

export const getAssignedTeam = (
  match: MatchesJoined,
  playerId: string
): string | null | undefined =>
  match.teams.find((player) => player.player_id === playerId)?.team;

export const isOpen = (match: MatchesRow) => match.status === MatchStatus.Open;
export const isStarted = (match: MatchesRow) =>
  match.status === MatchStatus.Ongoing || match.status === MatchStatus.Closed;

export const getTeamCaptain = (match: MatchesJoined, team: string): PlayersRow | null => {
  const captain = match.teams.find((player) => player.captain && player.team === team);
  if (!captain) {
    return null;
  }
  return match.players.find(({ id }) => id === captain.player_id) || null;
};
export const getCurrentTeam = (poolSize: number): 'a' | 'b' | null => {
  if (poolSize === 0) {
    return null;
  }
  if (poolSize === 1) {
    return 'a';
  }
  if (poolSize === 2) {
    return 'b';
  }
  return poolSize % 2 === 0 ? 'a' : 'b';
};

export const teamIncludes =
  (match: MatchesJoined, team: string | null) => (player: PlayersRow) =>
    match.teams.some(({ player_id, team: t }) => player_id === player.id && t === team);
export const getDraftStep = (match: MatchesJoined): DraftStep => {
  const pool = match.players.filter(teamIncludes(match, null));
  const team = getCurrentTeam(pool.length);
  const captain = team && pool.length > 1 ? getTeamCaptain(match, team) : null;
  return { pool, team, captain };
};

export const isCaptain = (match: MatchesJoined, userId?: string) => {
  const playerId = match.players.find((player) => player.user_id === userId)?.id;
  return match.teams.some((player) => player.player_id === playerId && player.captain);
};

export const hasPlayer = (playerId: string) => (match: MatchesJoined) =>
  match.players.some((player) => player.id === playerId);
export const notHasPlayer = (playerId: string) => (match: MatchesJoined) =>
  !match.players.some((player) => player.id === playerId);

export const isSummoning = (match: { status: MatchStatus }) =>
  match.status === MatchStatus.Summoning;

export const calculateMatchResults = (
  match: MatchesJoined
): Array<[PlayersRow, MatchResult | null]> => {
  const results = match.rounds
    .map(getRoundResults)
    .filter(isNotNull)
    .reduce(aggregateRound, {});
  return match.players.map((player) => [
    player,
    (player.keyhash && results[player.keyhash]) || null,
  ]);
};

const getRoundResults = (round: RoundsJoined): Record<string, MatchResult> | null => {
  const playerList: Array<PlayerListItem> =
    typeof round.pl === 'string' ? JSON.parse(round.pl) : null;

  if (playerList) {
    return playerList
      .map(({ keyhash, score, deaths, scoreKills }) => ({
        [keyhash]: {
          score: parseInt(score),
          deaths: parseInt(deaths),
          kills: parseInt(scoreKills),
        },
      }))
      .reduce(toObject, {});
  }
  return null;
};

const aggregateRound = (
  aggregated: Record<string, MatchResult>,
  current: Record<string, MatchResult>
): Record<string, MatchResult> =>
  Object.keys(current)
    .map((key) => ({
      [key]: {
        score: current[key].score + (aggregated[key]?.score || 0),
        deaths: current[key].deaths + (aggregated[key]?.deaths || 0),
        kills: current[key].kills + (aggregated[key]?.kills || 0),
      },
    }))
    .reduce(toObject);

const toObject = <T = unknown>(acc: Record<string, T>, curr: Record<string, T>) => ({
  ...acc,
  ...curr,
});
