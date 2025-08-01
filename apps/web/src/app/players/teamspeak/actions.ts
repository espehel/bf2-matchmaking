'use server';

import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { isString } from '@bf2-matchmaking/types';

export async function registerTeamspeakId(formData: FormData) {
  const tsid = formData.get('tsid');
  if (!isString(tsid)) {
    return { data: null, error: { message: 'Missing Teamspeak id' } };
  }

  const player_id = formData.get('player_id');
  if (!isString(player_id)) {
    return { data: null, error: { message: 'Missing player id' } };
  }

  const cookieStore = await cookies();
  return supabase(cookieStore).updatePlayer(player_id, { teamspeak_id: tsid });
}
