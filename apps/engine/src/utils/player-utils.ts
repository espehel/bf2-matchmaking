import {
  MatchPlayersInsert,
  PlayerRatingsRow,
  PlayersRow,
  RatedMatchPlayer,
} from '@bf2-matchmaking/types';

export const toMatchPlayerWithTeamAndRating =
  (matchId: number, team: number, ratings: Array<PlayerRatingsRow>) =>
  (player: PlayersRow): MatchPlayersInsert => ({
    match_id: matchId,
    player_id: player.id,
    team,
    rating: ratings.find((r) => r.player_id === player.id)?.rating || 1500,
  });
export const toMatchPlayer =
  (matchId: number) =>
  (player: PlayersRow): MatchPlayersInsert => ({
    match_id: matchId,
    player_id: player.id,
  });

export const withRating =
  (ratings: Array<PlayerRatingsRow>) =>
  (mp: MatchPlayersInsert): RatedMatchPlayer => ({
    ...mp,
    rating: ratings.find((r) => r.player_id === mp.player_id)?.rating || 1500,
  });

export function hasEqualKeyhash(playerA: { keyhash: string }) {
  return (playerB: { keyhash: string }) => playerA.keyhash === playerB.keyhash;
}
