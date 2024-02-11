import { MatchPlayersInsert, PlayerRatingsRow, PlayersRow } from '@bf2-matchmaking/types';
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
