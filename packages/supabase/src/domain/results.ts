import { SupabaseClient } from '@supabase/supabase-js';
import { resolveClient } from '../_client';
import { MatchResultsInsert, MatchResultsJoined } from '@bf2-matchmaking/types/supabase';

export function results(
  supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)
) {
  async function create(...results: Array<MatchResultsInsert>) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('match_results')
      .insert(results)
      .select<'*, team(*)', MatchResultsJoined>('*, team(*)');
  }
  async function getAll() {
    const client = await resolveClient(supabaseClient);
    return client
      .from('match_results')
      .select<'*, team(*)', MatchResultsJoined>('*, team(*)')
      .limit(20);
  }
  async function getByMatchId(matchId: number) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('match_results')
      .select<'*, team(*)', MatchResultsJoined>('*, team(*)')
      .eq('match_id', matchId);
  }
  async function getByMatchIds(matchIds: Array<number>) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('match_results')
      .select<'*, team(*)', MatchResultsJoined>('*, team(*)')
      .in('match_id', matchIds);
  }

  return {
    create,
    getAll,
    getByMatchId,
    getByMatchIds,
  };
}
