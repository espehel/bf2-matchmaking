import { Database } from '@bf2-matchmaking/types';
import { SupabaseClient } from '@supabase/supabase-js';

export async function resolveClient(
  client: SupabaseClient | (() => Promise<SupabaseClient>)
): Promise<SupabaseClient<Database>> {
  if (client instanceof SupabaseClient) {
    return client;
  }
  return client();
}
