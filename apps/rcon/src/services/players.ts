import { isNotNull, MatchPlayerResultsInsert } from '@bf2-matchmaking/types';
import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { toPlayerRatingUpdate } from '@bf2-matchmaking/utils/src/results-utils';

export async function updatePlayerRatings(
  playerResults: Array<MatchPlayerResultsInsert>,
  config: number
) {
  const playerRatings = await client()
    .getPlayerRatingsByIdList(
      playerResults.map((p) => p.player_id),
      config
    )
    .then(verifyResult);

  const playerUpdates = playerResults
    .map(toPlayerRatingUpdate(playerRatings, config))
    .filter(isNotNull);

  if (playerUpdates.length > 0) {
    return client().upsertPlayerRatings(playerUpdates).then(verifyResult);
  }

  return [];
}
