'use server';
import { getOptionalValues, getValues } from '@bf2-matchmaking/utils/src/form-data';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function createChallenge(formData: FormData) {
  const { configSelect, homeTeam, homeMap, homeServer, scheduledInput } = getValues(
    formData,
    'configSelect',
    'homeTeam',
    'homeMap',
    'homeServer',
    'scheduledInput'
  );
  const { awayTeam } = getOptionalValues(formData, 'awayTeam');

  const res = await supabase(cookies).createChallenge({
    config: Number(configSelect),
    home_team: Number(homeTeam),
    away_team: awayTeam !== null ? Number(awayTeam) : null,
    home_map: Number(homeMap),
    home_server: homeServer,
    scheduled_at: scheduledInput,
  });

  if (!res.error) {
    revalidatePath('/challenges');
  }
  return res;
}
