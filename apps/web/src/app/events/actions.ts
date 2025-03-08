import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { getValues } from '@bf2-matchmaking/utils/src/form-data';
import { revalidatePath } from 'next/cache';

export async function createEvent(data: FormData) {
  'use server';

  const { name, config, player } = getValues(data, 'name', 'config', 'player');
  const result = await supabase(cookies).createEvent({
    name,
    config: Number(config),
    owner: player,
  });

  if (!result.error) {
    revalidatePath('/events');
  }

  return result;
}
