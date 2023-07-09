import { MatchPlayersInsert, PlayersRow, User } from '@bf2-matchmaking/types';

export const toMatchPlayer =
  (matchId: number, team: 'a' | 'b') =>
  (player: PlayersRow): MatchPlayersInsert => ({
    match_id: matchId,
    player_id: player.id,
    team,
  });
