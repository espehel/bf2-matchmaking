import { SupabaseClient } from '@supabase/supabase-js';
import { Database, PlayersInsert, TeamspeakPlayer } from '@bf2-matchmaking/types';
import { PlayersUpdate } from '@bf2-matchmaking/schemas/types';

async function resolveClient(
  client: SupabaseClient | (() => Promise<SupabaseClient>)
): Promise<SupabaseClient<Database>> {
  if (client instanceof SupabaseClient) {
    return client;
  }
  return client();
}

export function playerRatings(
  supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)
) {
  async function get(config: number, playerIds: Array<string> | null) {
    const client = await resolveClient(supabaseClient);
    if (playerIds) {
      return client
        .from('player_ratings')
        .select('*')
        .eq('config', config)
        .in('player_id', playerIds);
    }
    return client.from('player_ratings').select('*').eq('config', config);
  }
  return {
    get,
  };
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
  async function getByMatchId(matchId: number | string) {
    const client = await resolveClient(supabaseClient);
    const mpResult = await client
      .from('match_players')
      .select('player_id')
      .eq('match_id', Number(matchId));

    if (mpResult.error) {
      return mpResult;
    }

    return client
      .from('players')
      .select('*')
      .in(
        'id',
        mpResult.data.map((mp) => mp.player_id)
      );
  }
  async function getAll(ids?: Array<string>) {
    const client = await resolveClient(supabaseClient);
    if (ids) {
      return client.from('players').select('*').in('id', ids);
    }
    return client.from('players').select('*');
  }
  async function getByUserId(userId: string) {
    const client = await resolveClient(supabaseClient);
    return client.from('players').select('*').eq('user_id', userId).single();
  }
  async function getByTeamspeakId(tsUId: string) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('players')
      .select('*')
      .eq('teamspeak_id', tsUId)
      .single<TeamspeakPlayer>();
  }
  async function update(playerId: string, values: Omit<PlayersUpdate, 'id'>) {
    const client = await resolveClient(supabaseClient);
    return client.from('players').update(values).eq('id', playerId).select('*').single();
  }

  return {
    create,
    get,
    getAll,
    getByMatchId,
    getByUserId,
    getByTeamspeakId,
    update,
    ratings: playerRatings(supabaseClient),
  };
}
