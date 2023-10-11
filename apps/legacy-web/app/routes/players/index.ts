import { json, LoaderArgs } from '@remix-run/node';
import { remixClient } from '@bf2-matchmaking/supabase';

export const loader = async ({ request }: LoaderArgs) => {
  const client = remixClient(request);
  const { data: players, error } = await client.getPlayers();
  if (error) {
    throw error;
  }
  return json({ players });
};
