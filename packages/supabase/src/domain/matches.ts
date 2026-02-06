import { SupabaseClient } from '@supabase/supabase-js';
import {
  Database,
  MatchDraftsInsert,
  MatchesJoined,
  MatchPlayersInsert,
  MatchServers,
  MatchServersInsert,
} from '@bf2-matchmaking/types';
import {
  MatchesInsert,
  MatchesUpdate,
  MatchplayersUpdate,
  MatchrolesInsert,
  PublicMatchRole,
} from '@bf2-matchmaking/schemas/types';
import { ResolvableSupabaseClient } from '../index';

async function resolveClient(
  client: ResolvableSupabaseClient
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
  async function update(
    matchId: number | string,
    playerIds: Array<string> | null,
    values: Omit<MatchplayersUpdate, 'match_id' | 'player_id'>
  ) {
    const client = await resolveClient(supabaseClient);

    if (playerIds) {
      return client
        .from('match_players')
        .update(values)
        .eq('match_id', Number(matchId))
        .in('player_id', playerIds)
        .select('*');
    }

    return client
      .from('match_players')
      .update(values)
      .eq('match_id', Number(matchId))
      .select('*');
  }
  async function upsert(values: Array<MatchPlayersInsert>) {
    const client = await resolveClient(supabaseClient);

    return client.from('match_players').upsert(values).select('*');
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
    add,
    get,
    update,
    upsert,
    remove,
    removeAll,
  };
}

export function matchRoles(
  supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)
) {
  async function get(matchId: number) {
    const client = await resolveClient(supabaseClient);
    return client.from('match_roles').select('*').eq('match_id', matchId);
  }
  async function add(values: MatchrolesInsert) {
    const client = await resolveClient(supabaseClient);
    return client.from('match_roles').insert(values).select('*').single();
  }
  async function del(matchId: number, role: PublicMatchRole) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('match_roles')
      .delete()
      .eq('match_id', matchId)
      .eq('name', role)
      .select('*');
  }
  return {
    add,
    get,
    del,
  };
}

export function matchMaps(
  supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)
) {
  async function get(matchId: number) {
    const client = await resolveClient(supabaseClient);
    return client.from('match_maps').select('*').eq('match_id', matchId);
  }
  async function add(matchId: number, ...maps: Array<number>) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('match_maps')
      .insert(maps.map((mapId) => ({ match_id: matchId, map_id: mapId })))
      .select('*');
  }
  async function remove(matchId: number, ...maps: Array<number>) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('match_maps')
      .delete()
      .eq('match_id', matchId)
      .in('map_id', maps)
      .select('*');
  }
  return {
    get,
    add,
    remove,
  };
}

export function matchServers(
  supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)
) {
  async function get(matchId: number) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('matches')
      .select('id, servers(*)')
      .eq('id', matchId)
      .single<MatchServers>();
  }
  async function add(matchId: number, ...servers: Array<Omit<MatchServersInsert, 'id'>>) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('match_servers')
      .insert(servers.map((server) => ({ id: matchId, ...server })))
      .select('*, server(*)')
      .single<MatchServers>();
  }
  async function remove(matchId: number, ...servers: Array<string>) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('match_servers')
      .delete()
      .eq('id', matchId)
      .in('server', servers)
      .select('id, servers(*)')
      .single<MatchServers>();
  }
  async function removeAll() {
    const client = await resolveClient(supabaseClient);
    return client
      .from('match_servers')
      .delete()
      .select('id, servers(*)')
      .single<MatchServers>();
  }
  return {
    get,
    add,
    remove,
    removeAll,
  };
}

const MATCHES_JOINED_QUERY =
  '*, players!match_players(*), maps(*), config!inner(*), teams:match_players(*), rounds(*, map(*), team1(*), team2(*)), home_team(*, players:team_players(*, player:players(*))), away_team(*, players:team_players(*, player:players(*)))';

export function matches(
  supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)
) {
  async function create(values: MatchesInsert) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('matches')
      .insert(values)
      .select(MATCHES_JOINED_QUERY)
      .single<MatchesJoined>();
  }
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
  async function update(matchId: number | string, values: MatchesUpdate) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('matches')
      .update(values)
      .eq('id', Number(matchId))
      .select(MATCHES_JOINED_QUERY)
      .single<MatchesJoined>();
  }
  async function remove(matchId: number) {
    const client = await resolveClient(supabaseClient);
    return client.from('matches').delete().eq('id', matchId);
  }
  return {
    create,
    getAll,
    get,
    getJoined,
    update,
    remove,
    players: matchPlayers(supabaseClient),
    roles: matchRoles(supabaseClient),
    maps: matchMaps(supabaseClient),
    servers: matchServers(supabaseClient),
    drafts: matchDrafts(supabaseClient),
  };
}
