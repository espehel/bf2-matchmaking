'use server';

import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isString } from '@bf2-matchmaking/types';
import { getValues } from '@bf2-matchmaking/utils/src/form-data';
import { toAsyncError } from '@bf2-matchmaking/utils/src/async-actions';

export async function createTeam(data: FormData) {
  const { nameInput, avatarInput } = getValues(data, 'nameInput', 'avatarInput');
  const { data: owner, error } = await supabase(cookies).getSessionPlayer();

  if (error) {
    return toAsyncError(error);
  }

  const { data: team, error: teamError } = await supabase(cookies).createTeam({
    name: nameInput,
    avatar: isString(avatarInput) ? avatarInput : null,
    owner: owner.id,
  });

  if (teamError) {
    return toAsyncError('Failed to create team');
  }

  await supabase(cookies).createTeamPlayer({
    team_id: team.id,
    player_id: owner.id,
    captain: true,
  });

  redirect(`/teams/${team.id}`);
  return { data: team, error: null };
}
