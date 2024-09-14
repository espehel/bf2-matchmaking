import {
  isNotNull,
  MatchesJoined,
  MatchPlayerResultsInsert,
} from '@bf2-matchmaking/types';
import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { toPlayerRatingUpdate } from '@bf2-matchmaking/utils/src/results-utils';
import { mapToKeyhashes } from '@bf2-matchmaking/utils/src/round-utils';
import { hasNotKeyhash } from '@bf2-matchmaking/utils';
import { logMessage } from '@bf2-matchmaking/logging';

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

export async function fixMissingMatchPlayers(match: MatchesJoined) {
  const keyHashes = mapToKeyhashes(match.rounds);
  const orphanKeys = keyHashes.filter(hasNotKeyhash(match));
  const orphanPlayers = match.players.filter(
    (p) => !(p.keyhash && keyHashes.includes(p.keyhash))
  );

  if (orphanPlayers.length === 1 && orphanKeys.length === 1) {
    const player = orphanPlayers[0];
    await client().updatePlayer(player.id, { keyhash: orphanKeys[0] });

    const { data } = await client().getMatch(match.id);
    logMessage(`Match ${match.id}: Fixed missing player`, {
      player,
      keyhash: orphanKeys[0],
      match: data,
    });

    return data;
  }
  return null;
}
