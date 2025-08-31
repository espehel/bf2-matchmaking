import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { getValues } from '@bf2-matchmaking/utils/form';
import { revalidatePath } from 'next/cache';

export async function createEvent(data: FormData) {
  'use server';
  const cookieStore = await cookies();
  const { name, config, player } = getValues(data, 'name', 'config', 'player');
  const result = await supabase(cookieStore).createEvent({
    name,
    config: Number(config),
    owner: player,
  });

  if (!result.error) {
    revalidatePath('/events');
  }

  return result;
}
