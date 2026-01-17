import { ActiveTeam, MatchesJoined, MatchPlayersInsert } from '@bf2-matchmaking/types';

export const isTeam = (team: number) => (mp: MatchPlayersInsert) => mp.team === team;

export function isTeamOfficer(team: ActiveTeam, playerId: string) {
  return team.players.some((player) => player.player_id === playerId && player.captain);
}

export function matchTeamsHasPlayer(match: MatchesJoined, playerId: string) {
  return (
    match.home_team.players.some((player) => player.player_id === playerId) ||
    match.away_team.players.some((player) => player.player_id === playerId)
  );
}
