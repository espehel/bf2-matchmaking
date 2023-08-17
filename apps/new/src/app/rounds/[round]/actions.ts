'use server';

import { PlayersUpdate } from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function updatePlayer(roundId: number, id: string, values: PlayersUpdate) {
  const result = await supabase(cookies).updatePlayer(id, values);

  if (!result.error) {
    revalidatePath(`/rounds/${roundId}`);
  }

  return result;
}
