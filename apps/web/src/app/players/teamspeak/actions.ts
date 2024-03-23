'use server';

import { assertTruthyString } from '@bf2-matchmaking/utils';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

export async function registerTeamspeakId(formData: FormData) {
  const clid = formData.get('clid');
  assertTruthyString(clid, 'Missing Teamspeak id');
  const player_id = formData.get('player_id');
  assertTruthyString(player_id, 'Missing Discord id');

  return supabase(cookies).updatePlayer(player_id, { teamspeak_id: clid });
}
