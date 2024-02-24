import {
  isRatedMatchPlayer,
  isTeamPlayer,
  MatchesJoined,
  MatchPlayersInsert,
  MatchPlayersRow,
  PlayerListItem,
  PlayersRow,
  RatedMatchPlayer,
  TeamPlayer,
} from '@bf2-matchmaking/types';
import { shuffleArray } from './array-utils';

export const assignMatchPlayerTeams = (players: Array<PlayersRow>) =>
  shuffleArray(players).map((player, i) => ({
    player_id: player.id,
    team: i % 2 === 1 ? 1 : 2,
  }));

export const getTeamPlayers = (
  teams: Array<MatchPlayersInsert>,
  players: Array<PlayersRow>,
  team: number
): Array<TeamPlayer> =>
  teams
    .filter((player) => player.team === team)
    .map((matchPlayer) => ({
      ...matchPlayer,
      player: players.find((player) => player.id === matchPlayer.player_id),
    }))
    .filter(isTeamPlayer);

export const findPlayerName = (
  match: MatchesJoined,
  playerId: string | undefined
): string | undefined => playerId && match.players.find((p) => p.id === playerId)?.nick;

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

export function isBetaTester(player: PlayersRow) {
  return player.beta_tester;
}

export function getAverageRating(players: Array<MatchPlayersInsert>) {
  return (
    players.filter(isRatedMatchPlayer).reduce((acc, cur) => acc + cur.rating, 0) /
    players.length
  );
}

export function getMatchPlayerNameWithRating(players: Array<PlayersRow>) {
  return (mp: MatchPlayersInsert) => {
    const nick = players.find((p) => p.id === mp.player_id)?.nick || 'Unknown';
    const rating = mp.rating || -1;
    return `${nick} (${rating})`;
  };
}

export function compareRating(mpA: RatedMatchPlayer, mpB: RatedMatchPlayer) {
  return mpB.rating - mpA.rating;
}

export function compareMPRating(mpA: MatchPlayersInsert, mpB: MatchPlayersInsert) {
  return (mpB.rating || -1) - (mpA.rating || -1);
}
