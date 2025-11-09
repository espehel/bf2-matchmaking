import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@bf2-matchmaking/types';
import { MatchconfigsUpdate } from '@bf2-matchmaking/schemas/types';

async function resolveClient(
  client: SupabaseClient | (() => Promise<SupabaseClient>)
): Promise<SupabaseClient<Database>> {
  if (client instanceof SupabaseClient) {
    return client;
  }
  return client();
}

export function configs(
  supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)
) {
  async function get(configId: number) {
    const client = await resolveClient(supabaseClient);
    return client.from('match_configs').select('*').eq('id', configId).single();
  }
  async function getByMatchId(matchId: number | string) {
    const client = await resolveClient(supabaseClient);
    const matchResult = await client
      .from('matches')
      .select('config')
      .eq('id', Number(matchId))
      .single();

    if (matchResult.error) {
      return matchResult;
    }

    return client
      .from('match_configs')
      .select('*')
      .eq('id', matchResult.data.config)
      .single();
  }

  async function update(configId: number, values: Omit<MatchconfigsUpdate, 'id'>) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('match_configs')
      .update(values)
      .eq('id', configId)
      .select('*')
      .single();
  }
  return {
    get,
    getByMatchId,
    update,
  };
}
