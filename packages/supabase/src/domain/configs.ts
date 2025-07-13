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

export function configs(
  supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)
) {
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
  return {
    getByMatchId,
  };
}
