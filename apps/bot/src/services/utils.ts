import {
  MatchesJoined,
  MatchPlayersInsert,
  MatchPlayersRow,
  PlayerRatingsRow,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { Embed } from 'discord.js';
export const toMatchPlayerWithTeam =
  (matchId: number, team: number) =>
  (player: PlayersRow): MatchPlayersInsert => ({
    match_id: matchId,
    player_id: player.id,
    team,
  });
export const toMatchPlayerWithRating =
  (matchId: number, ratings: Array<PlayerRatingsRow>) =>
  (player: PlayersRow): MatchPlayersInsert => ({
    match_id: matchId,
    player_id: player.id,
    rating: ratings.find((r) => r.player_id === player.id)?.rating || 1500,
  });

export function getUserIds(embed: Embed, name: string) {
  return (
    embed.fields
      ?.find((field) => field.name.includes(name))
      ?.value.match(/(?<=<@)\d+(?=>)/g) || []
  );
}

export const getUserNames = (embed: Embed, name: string) =>
  embed.fields
    ?.find((field) => field.name.includes(name))
    ?.value.match(/(?<=`)([^`\n]+)(?=`)/g) || [];

export function hasEqualMaps(match: MatchesJoined, maps: Array<number>) {
  return (
    match.maps.length === maps.length && match.maps.every((m) => maps.includes(m.id))
  );
}

export function hasEqualPlayers(match: MatchesJoined, players: Array<PlayersRow>) {
  return (
    match.players.length === players.length &&
    match.players.every((p) => players.some((newP) => newP.id === p.id))
  );
}

export function hasEqualTeams(match: MatchesJoined, teams: Array<MatchPlayersInsert>) {
  return (
    match.teams.length === teams.length &&
    match.teams.every((mp) => teams.some((newMp) => isEqualMatchPlayer(mp, newMp)))
  );
}

export function isEqualMatchPlayer(mp: MatchPlayersRow, newMp: MatchPlayersInsert) {
  return (
    mp.player_id === newMp.player_id &&
    mp.captain === newMp.captain &&
    mp.team === newMp.team &&
    mp.rating === newMp.rating &&
    mp.ready === newMp.ready
  );
}
