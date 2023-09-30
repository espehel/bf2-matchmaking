import {
  isTeamPlayer,
  MatchesJoined,
  PlayerListItem,
  PlayersRow,
  TeamPlayer,
} from '@bf2-matchmaking/types';
import { shuffleArray } from './array-utils';

export const assignMatchPlayerTeams = (players: Array<PlayersRow>) =>
  shuffleArray(players).map((player, i) => ({
    player_id: player.id,
    team: i % 2 === 1 ? 1 : 2,
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

export const getPlayerTeam = (playerId: string, match: MatchesJoined): number | null =>
  match.teams.find((mp) => mp.player_id === playerId)?.team || null;

export function getPlayersToSwitch(
  match: MatchesJoined,
  pl: Array<PlayerListItem>
): Array<string> {
  return pl
    .filter((sp) => {
      const player = match.players.find((p) => p.keyhash === sp.keyhash);
      if (!player) {
        return false;
      }
      const team = match.teams.find((mp) => mp.player_id === player.id)?.team;
      if (!team) {
        return false;
      }
      if (match.home_team.id === team && sp.getTeam === '2') {
        return false;
      }
      if (match.away_team.id === team && sp.getTeam === '1') {
        return false;
      }
      return true;
    })
    .map(({ index }) => index);
}

export function getMatchPlayer(match: MatchesJoined) {
  return (playerInfo: PlayerListItem) => {
    const id = match.players.find((p) => p.keyhash === playerInfo.keyhash)?.id;
    return match.teams.find((p) => p.player_id === id);
  };
}
