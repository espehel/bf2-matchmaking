import { MatchServersInsert } from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function updateMatchServer(values: MatchServersInsert) {
  const result = await supabase(cookies).upsertMatchServer(values);

  if (result.data) {
    revalidatePath(`/matches/${result.data.id}/server`);
  }

  return result;
}
