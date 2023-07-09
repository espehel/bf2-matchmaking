import { PlayersRow, User } from '@bf2-matchmaking/types';
import { client } from '@bf2-matchmaking/supabase';
import { getCachedValue, setCachedValue } from '@bf2-matchmaking/utils/src/cache';

export const getPlayerFromDatabase = async (user: User): Promise<PlayersRow> => {
  const cachedPlayer = getCachedValue<PlayersRow>(user.id);
  if (cachedPlayer) {
    return cachedPlayer;
  }

  const player = await client().services.getOrCreatePlayer(user);
  setCachedValue(user.id, player);
  return player;
};
