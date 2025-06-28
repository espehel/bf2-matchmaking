import { SupabaseClient } from '@supabase/supabase-js';
import { Database, PlayersInsert } from '@bf2-matchmaking/types';

async function resolveClient(
  client: SupabaseClient | (() => Promise<SupabaseClient>)
): Promise<SupabaseClient<Database>> {
  if (client instanceof SupabaseClient) {
    return client;
  }
  return client();
}

export function players(
  supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)
) {
  async function create(player: PlayersInsert) {
    const client = await resolveClient(supabaseClient);
    return client.from('players').insert(player).select('*').single();
  }
  async function get(playerId: string) {
    const client = await resolveClient(supabaseClient);
    return client.from('players').select('*').eq('id', playerId).single();
  }
  async function getAll(ids: Array<string>) {
    const client = await resolveClient(supabaseClient);
    return client.from('players').select('*').in('id', ids);
  }
  async function getByUserId(userId: string) {
    const client = await resolveClient(supabaseClient);
    return client.from('players').select('*').eq('user_id', userId).single();
  }

  return {
    create,
    get,
    getAll,
    getByUserId,
  };
}
