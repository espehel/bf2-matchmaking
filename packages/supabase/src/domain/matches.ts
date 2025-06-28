import { SupabaseClient } from '@supabase/supabase-js';
import {
  Database,
  MatchDraftsInsert,
  MatchesJoined,
  MatchPlayersInsert,
} from '@bf2-matchmaking/types';

async function resolveClient(
  client: SupabaseClient | (() => Promise<SupabaseClient>)
): Promise<SupabaseClient<Database>> {
  if (client instanceof SupabaseClient) {
    return client;
  }
  return client();
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

function matchPlayers(supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)) {
  async function get(matchId: number) {
    const client = await resolveClient(supabaseClient);
    return client.from('match_players').select('*').eq('match_id', matchId);
  }
  async function add(...values: Array<MatchPlayersInsert>) {
    const client = await resolveClient(supabaseClient);
    return client.from('match_players').insert(values).select('*');
  }
  async function remove(matchId: number, ...playerIds: Array<string>) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('match_players')
      .delete()
      .eq('match_id', matchId)
      .in('player_id', playerIds)
      .select('*');
  }
  async function removeAll(matchId: number) {
    const client = await resolveClient(supabaseClient);
    return client.from('match_players').delete().eq('match_id', matchId);
  }
  return {
    get,
    add,
    remove,
    removeAll,
  };
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
  async function getJoined(matchId: number | string) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('matches')
      .select(
        '*, players!match_players(*), maps(*), config!inner(*), teams:match_players(*), rounds(*, map(*), team1(*), team2(*)), home_team(*, players:team_players(*, player:players(*))), away_team(*, players:team_players(*, player:players(*)))'
      )
      .eq('id', Number(matchId))
      .single<MatchesJoined>();
  }
  return {
    getAll,
    get,
    getJoined,
    players: matchPlayers(supabaseClient),
  };
}
