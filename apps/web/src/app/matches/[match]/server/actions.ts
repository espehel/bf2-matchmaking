import { MatchesJoined, MatchServer, MatchServersInsert } from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { generateServers } from '@bf2-matchmaking/server';

export async function updateMatchServer(values: MatchServersInsert) {
  const result = await supabase(cookies).upsertMatchServer(values);

  if (result.data) {
    revalidatePath(`/matches/${result.data.id}/server`);
  }

  return result;
}

export async function generateMatchServers(
  match: MatchesJoined,
  matchServer: MatchServer
) {
  if (matchServer.locations.length > 0) {
    const result = await generateServers(match, matchServer.locations);

    if (result.instances.length) {
      revalidatePath(`/matches/${match.id}`);
      return { data: result.instances, error: null };
    } else {
      return { data: null, error: { message: `["${result.errors.join('", "')}"]` } };
    }
  }
  return { data: null, error: { message: 'Invalid match for generating server' } };
}
