import { ActiveTeam, MatchPlayersInsert } from '@bf2-matchmaking/types';

export const isTeam = (team: number) => (mp: MatchPlayersInsert) => mp.team === team;

export function isTeamOfficer(team: ActiveTeam, playerId: string) {
  return team.players.some((player) => player.player_id === playerId && player.captain);
}
