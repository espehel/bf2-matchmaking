import { getDiscordClient } from '../discord/client';
import { getOrCreatePlayer } from './supabase-service';

export async function getPlayersByIdList(playerIds: Array<string>) {
  const client = await getDiscordClient();
  return Promise.all(
    playerIds.map((player) => client.users.fetch(player).then(getOrCreatePlayer))
  );
}
