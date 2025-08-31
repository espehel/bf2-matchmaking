'use server';

import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isString } from '@bf2-matchmaking/types';
import { getOptionalValue, getValue } from '@bf2-matchmaking/utils/form';
import { toAsyncError } from '@bf2-matchmaking/utils';

export async function createTeam(data: FormData) {
  const nameInput = getValue(data, 'nameInput');
  const avatarInput = getOptionalValue(data, 'avatarInput');
  const cookieStore = await cookies();
  const { data: owner, error } = await supabase(cookieStore).getSessionPlayer();

  if (error) {
    return toAsyncError(error);
  }

  const { data: team, error: teamError } = await supabase(cookieStore).createTeam({
    name: nameInput,
    avatar: isString(avatarInput) ? avatarInput : null,
    owner: owner.id,
  });

  if (teamError) {
    return toAsyncError('Failed to create team');
  }

  await supabase(cookieStore).createTeamPlayer({
    team_id: team.id,
    player_id: owner.id,
    captain: true,
  });

  redirect(`/teams/${team.id}`);
  return { data: team, error: null };
}
