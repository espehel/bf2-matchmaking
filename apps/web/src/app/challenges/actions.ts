'use server';
import { getValues } from '@bf2-matchmaking/utils/form';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function addChallengeTeam(formData: FormData) {
  const cookieStore = await cookies();
  const { configId, teamId } = getValues(formData, 'configId', 'teamId');
  const res = await supabase(cookieStore).insertChallengeTeam({
    config: Number(configId),
    team_id: Number(teamId),
  });
  if (!res.error) {
    revalidatePath('/challenges');
  }
  return res;
}
