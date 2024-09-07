'use server';
import { getValues } from '@bf2-matchmaking/utils/src/form-data';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function addChallengeTeam(formData: FormData) {
  const { configId, teamId } = getValues(formData, 'configId', 'teamId');
  const res = await supabase(cookies).insertChallengeTeam({
    config: Number(configId),
    team_id: Number(teamId),
  });
  if (!res.error) {
    revalidatePath('/challenges');
  }
  return res;
}
