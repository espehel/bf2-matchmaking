import { getOrCreatePlayer } from './supabase-service';
import { discordClient } from '../client';

export async function getPlayersByIdList(playerIds: Array<string>) {
  return Promise.all(
    playerIds.map((player) => discordClient.users.fetch(player).then(getOrCreatePlayer))
  );
}
