import {
  DraftStep,
  MatchesJoined,
  MatchesRow,
  MatchStatus,
  PlayersRow,
  ScheduledMatch,
} from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';

export const isAssignedTeam = (
  match: MatchesJoined,
  playerId: string,
  team: 'a' | 'b' | null
) => match.teams.some((player) => player.player_id === playerId && player.team === team);

export const getAssignedTeam = (
  match: MatchesJoined,
  playerId: string
): number | null | undefined =>
  match.teams.find((player) => player.player_id === playerId)?.team;

export const isOpen = (match: MatchesJoined) => match.status === MatchStatus.Open;
export const isStarted = (match: MatchesJoined) =>
  match.status === MatchStatus.Ongoing || match.status === MatchStatus.Closed;

export const getTeamCaptain = (match: MatchesJoined, team: number): PlayersRow | null => {
  const captain = match.teams.find((player) => player.captain && player.team === team);
  if (!captain) {
    return null;
  }
  return match.players.find(({ id }) => id === captain.player_id) || null;
};
export const getCurrentTeam = (poolSize: number): 1 | 2 | null => {
  if (poolSize === 0) {
    return null;
  }
  if (poolSize === 1) {
    return 1;
  }
  if (poolSize === 2) {
    return 2;
  }
  return poolSize % 2 === 0 ? 1 : 2;
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

export const isCaptain = (match: MatchesJoined, player: PlayersRow) => {
  return match.teams.some((mp) => mp.player_id === player.id && mp.captain);
};

export const isTeamCaptain = (match: MatchesJoined, player: PlayersRow) => {
  return [...match.home_team.players, ...match.away_team.players].some(
    (tp) => tp.player_id === player.id && tp.captain
  );
};

export const hasPlayer = (playerId: string) => (match: MatchesJoined) =>
  match.players.some((player) => player.id === playerId);
export const notHasPlayer = (playerId: string) => (match: MatchesJoined) =>
  !match.players.some((player) => player.id === playerId);

export const isSummoning = (match: { status: MatchStatus }) =>
  match.status === MatchStatus.Summoning;

export function toGroup<T extends [string, MatchesJoined]>(
  acc: Record<string, Array<MatchesJoined>>,
  curr: T
): Record<string, Array<MatchesJoined>> {
  const [key, value] = curr;
  return acc[key] ? { ...acc, [key]: [...acc[key], value] } : { ...acc, [key]: [value] };
}

export function compareStartedAt(
  a: MatchesRow | MatchesJoined | undefined,
  b: MatchesRow | MatchesJoined | undefined
) {
  return (b?.started_at || '0').localeCompare(a?.started_at || '0');
}

export function toRaidOrganizerCommand(match: ScheduledMatch) {
  const title = `title:${match.config.type}: ${match.home_team.name} vs. ${match.away_team.name}`;
  const eventStart = `event_start:${DateTime.fromISO(match.scheduled_at).toFormat(
    'dd.MM.yyyy HH:mm'
  )}`;
  const template = 'template:3 - 8v8';
  const description = `description:${
    match.maps.length > 0 ? match.maps.map(({ name }) => name).join(' + ') : 'Maps TBD'
  }`;

  return `/event create ${title} ${eventStart} ${template} ${description}`;
}
