import { MatchPlayersInsert, PlayerRatingsRow, PlayersRow } from '@bf2-matchmaking/types';
import { Embed } from 'discord.js';
export const toMatchPlayer =
  (matchId: number, team: number, ratings: Array<PlayerRatingsRow>) =>
  (player: PlayersRow): MatchPlayersInsert => ({
    match_id: matchId,
    player_id: player.id,
    team,
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
