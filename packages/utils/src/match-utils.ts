import {
  DraftStep,
  MatchesJoined,
  MatchesRow,
  MatchStatus,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { match } from 'assert';

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
