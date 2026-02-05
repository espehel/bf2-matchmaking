import { SupabaseClient } from '@supabase/supabase-js';
import { resolveClient } from '../_client';
import { InactiveTeam, TeamsJoined } from '@bf2-matchmaking/types';

export function teams(supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)) {
  async function getJoined(teamId: number) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('teams')
      .select(
        '*, owner(*), players!team_players(*), captains:team_players(*), challenges:challenge_teams(*)'
      )
      .eq('id', teamId)
      .single<TeamsJoined>();
  }
  async function getAllJoined() {
    const client = await resolveClient(supabaseClient);
    return client
      .from('teams')
      .select(
        '*, owner(*), players!team_players(*), captains:team_players(*), challenges:challenge_teams(*)'
      )
      .overrideTypes<Array<TeamsJoined>, { merge: false }>();
  }
  async function getInActive() {
    const client = await resolveClient(supabaseClient);
    return client
      .from('teams')
      .select('*, owner(*)')
      .eq('active', false)
      .overrideTypes<Array<InactiveTeam>, { merge: false }>();
  }
  async function getActive() {
    const client = await resolveClient(supabaseClient);
    return client
      .from('teams')
      .select('*, owner(*), players:team_players(*),challenges:challenge_teams(*)')
      .eq('active', true)
      .overrideTypes<Array<InactiveTeam>, { merge: false }>();
  }

  return {
    getJoined,
    getAllJoined,
    getInActive,
    getActive,
  };
}
