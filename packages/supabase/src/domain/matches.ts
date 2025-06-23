import { SupabaseClient } from '@supabase/supabase-js';
import { Database, MatchDraftsInsert } from '@bf2-matchmaking/types';

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

export function matchDrafts(
  supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)
) {
  async function create(values: MatchDraftsInsert) {
    const client = await resolveClient(supabaseClient);
    return client.from('match_drafts').insert(values).select('*').single();
  }
  async function get(matchId: number) {
    const client = await resolveClient(supabaseClient);
    return client.from('match_drafts').select('*').eq('match_id', matchId).single();
  }
  return {
    create,
    get,
  };
}
