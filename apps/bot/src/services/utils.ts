import { MatchPlayersInsert, PlayerRatingsRow, PlayersRow } from '@bf2-matchmaking/types';
import { MessageReaction } from 'discord.js';

export const compareMessageReactionCount = (
  firstValue: MessageReaction,
  secondValue: MessageReaction
) => secondValue.count - firstValue.count;

export const toMatchPlayer =
  (matchId: number, team: number, ratings: Array<PlayerRatingsRow>) =>
  (player: PlayersRow): MatchPlayersInsert => ({
    match_id: matchId,
    player_id: player.id,
    team,
    rating: ratings.find((r) => r.player_id === player.id)?.rating || 1500,
  });
