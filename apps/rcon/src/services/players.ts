import {
  isNotNull,
  MatchPlayerResultsInsert,
  PlayersRow,
  User,
} from '@bf2-matchmaking/types';
import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { getCachedValue, setCachedValue } from '@bf2-matchmaking/utils/src/cache';
import { toPlayerRatingUpdate } from '@bf2-matchmaking/utils/src/results-utils';

export const getPlayerFromDatabase = async (user: User): Promise<PlayersRow> => {
  const cachedPlayer = getCachedValue<PlayersRow>(user.id);
  if (cachedPlayer) {
    return cachedPlayer;
  }

  const player = await client().services.getOrCreatePlayer(user);
  setCachedValue(user.id, player);
  return player;
};

export async function updatePlayerRatings(
  playerUpdates: Array<MatchPlayerResultsInsert>
) {
  const players = await client()
    .getPlayersByIdList(playerUpdates.map((p) => p.player_id))
    .then(verifyResult);

  await client()
    .updatePlayers(playerUpdates.map(toPlayerRatingUpdate(players)).filter(isNotNull))
    .then(verifyResult);
}
