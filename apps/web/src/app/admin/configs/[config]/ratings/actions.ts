'use server';
import { PlayerRatingsInsert } from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import { revalidatePath } from 'next/cache';

export async function upsertRatingsForConfig(
  configId: number,
  values: Array<Omit<PlayerRatingsInsert, 'config'>>
) {
  const cookieStore = await cookies();
  const config = await supabase(cookieStore)
    .getMatchConfig(configId)
    .then(verifySingleResult);
  if (!config.fixed_ratings) {
    throw new Error('Ratings are not fixed');
  }

  const result = await supabase(cookieStore).upsertPlayerRatings(
    values.map((value) => ({ ...value, config: configId }))
  );
  if (!result.error) {
    revalidatePath(`/admin/configs/${configId}/ratings`);
  }
  return result;
}
