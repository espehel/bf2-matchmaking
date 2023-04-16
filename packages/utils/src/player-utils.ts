import {
  isTeamPlayer,
  MatchesJoined,
  PlayersRow,
  TeamPlayer,
} from '@bf2-matchmaking/types';
import { shuffleArray } from './array-utils';

export const assignMatchPlayerTeams = (players: Array<PlayersRow>) =>
  shuffleArray(players).map((player, i) => ({
    player_id: player.id,
    team: i % 2 === 1 ? 'a' : 'b',
  }));

export const getTeamPlayers = (
  match: MatchesJoined,
  team?: 'a' | 'b' | null
): Array<TeamPlayer> =>
  match.teams
    .filter((player) => (typeof team === 'undefined' ? true : player.team === team))
    .map((matchPlayer) => ({
      ...matchPlayer,
      player: match.players.find((player) => player.id === matchPlayer.player_id),
    }))
    .filter(isTeamPlayer);

export const getPlayerName = (tp: TeamPlayer) =>
  tp.captain ? `**${tp.player.full_name}**` : tp.player.full_name;

export const findPlayerName = (
  match: MatchesJoined,
  playerId: string | undefined
): string | undefined =>
  playerId && match.players.find((p) => p.id === playerId)?.full_name;

export const getPlayerTeam = (playerId: string, match: MatchesJoined): string | null =>
  match.teams.find((mp) => mp.player_id === playerId)?.team || null;
