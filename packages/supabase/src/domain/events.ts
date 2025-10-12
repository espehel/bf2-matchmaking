import { SupabaseClient } from '@supabase/supabase-js';
import { resolveClient } from '../_client';
import {
  EventMatchesInsert,
  EventsInsert,
  EventsJoined,
  EventsMatchJoined,
} from '@bf2-matchmaking/types/supabase';

const EVENT_QUERY =
  '*, teams!event_teams(*), rounds:event_rounds!event_rounds_event_fkey(*, matches:event_matches(*)), matches!event_matches(id, home_team(*), away_team(*))';

export function matches(
  supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)
) {
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
  return {
    create,
    get,
  };
}

export function events(supabaseClient: SupabaseClient | (() => Promise<SupabaseClient>)) {
  async function create(values: EventsInsert) {
    const client = await resolveClient(supabaseClient);
    return client.from('events').insert(values).select('*').single();
  }
  async function get(eventId: number) {
    const client = await resolveClient(supabaseClient);
    client.from('events').select(EVENT_QUERY).eq('id', eventId).single<EventsJoined>();
  }

  return {
    create,
    get,
    matches: matches(supabaseClient),
  };
}
