import {
  MatchesJoined,
  MatchPlayersInsert,
  PlayerRatingsRow,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { MessageReaction } from 'discord.js';

export function compareMessageReactionCount(match: MatchesJoined) {
  const matchPlayers = match.players.map((player) => player.id);
  return (firstValue: MessageReaction, secondValue: MessageReaction) =>
    getValidUsersCount(secondValue, matchPlayers) -
    getValidUsersCount(firstValue, matchPlayers);
}

function getValidUsersCount(reaction: MessageReaction, matchPlayers: Array<string>) {
  return Array.from(reaction.users.cache.keys()).filter((user) =>
    matchPlayers.includes(user)
  ).length;
}
export const toMatchPlayer =
  (matchId: number, team: number, ratings: Array<PlayerRatingsRow>) =>
  (player: PlayersRow): MatchPlayersInsert => ({
    match_id: matchId,
    player_id: player.id,
    team,
    rating: ratings.find((r) => r.player_id === player.id)?.rating || 1500,
  });
