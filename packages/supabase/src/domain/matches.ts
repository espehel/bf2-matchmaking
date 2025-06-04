import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@bf2-matchmaking/types';

async function resolveClient(
  client: SupabaseClient | (() => Promise<SupabaseClient>)
): Promise<SupabaseClient<Database>> {
  if (client instanceof SupabaseClient) {
    return client;
  }
  return client();
}

export function matches(
  supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)
) {
  async function getAll() {
    const client = await resolveClient(supabaseClient);
    return client.from('matches').select('*');
  }
  async function get(matchId: number | string) {
    const client = await resolveClient(supabaseClient);
    return client.from('matches').select('*').eq('id', Number(matchId)).single();
  }
  return {
    getAll,
    get,
  };
}
