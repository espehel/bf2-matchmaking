import { SupabaseClient } from '@supabase/supabase-js';
import { resolveClient } from '../_client';
import {
  EventMatchesInsert,
  EventsInsert,
  EventsJoined,
  EventsMatchJoined,
  EventsRound,
} from '@bf2-matchmaking/types/supabase';
import { EventmatchesUpdate, EventroundsUpdate } from '@bf2-matchmaking/schemas/types';

const EVENT_QUERY =
  '*, teams!event_teams(*), rounds:event_rounds!event_rounds_event_fkey(*, matches:event_matches(*)), matches!event_matches(id, home_team(*), away_team(*))';

function matches(supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)) {
  async function create(values: EventMatchesInsert) {
    const client = await resolveClient(supabaseClient);
    return client.from('event_matches').insert(values).select('*').single();
  }
  async function get(matchId: number) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('event_matches')
      .select('*, event(*), round(*)')
      .eq('match', matchId)
      .single<EventsMatchJoined>(); // TODO: fix these request to not contain so much data
  }
  async function remove(matchId: number) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('event_matches')
      .delete()
      .eq('match', matchId)
      .select('*')
      .single();
  }
  async function update(matchId: number, values: Omit<EventmatchesUpdate, 'match'>) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('event_matches')
      .update(values)
      .eq('match', matchId)
      .select('*')
      .single();
  }

  return {
    create,
    get,
    update,
    remove,
  };
}

function rounds(supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)) {
  async function get(roundId: number) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('event_rounds')
      .select('*, event(*), event_matches(*, match(*, home_team(*), away_team(*)))')
      .eq('id', roundId)
      .single<EventsRound>();
  }
  async function update(roundId: number, values: Omit<EventroundsUpdate, 'id'>) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('event_rounds')
      .update(values)
      .eq('id', roundId)
      .select('*')
      .single<EventsRound>();
  }
  return {
    get,
    update,
  };
}

export function events(supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)) {
  async function create(values: EventsInsert) {
    const client = await resolveClient(supabaseClient);
    return client.from('events').insert(values).select('*').single();
  }
  async function get(eventId: number) {
    const client = await resolveClient(supabaseClient);
    return client
      .from('events')
      .select(EVENT_QUERY)
      .eq('id', eventId)
      .single<EventsJoined>();
  }

  return {
    create,
    get,
    matches: matches(supabaseClient),
    rounds: rounds(supabaseClient),
  };
}
