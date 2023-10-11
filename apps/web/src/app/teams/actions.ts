'use server';
import { assertString } from '@bf2-matchmaking/utils';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isString } from '@bf2-matchmaking/types';
export async function createTeam(data: FormData) {
  const { nameInput, avatarInput } = Object.fromEntries(data);
  assertString(nameInput);

  const { data: owner, error } = await supabase(cookies).getSessionPlayer();

  if (error) {
    return { error: error.message, data: null };
  }

  const { data: team, error: teamError } = await supabase(cookies).createTeam({
    name: nameInput,
    avatar: isString(avatarInput) ? avatarInput : null,
    owner: owner.id,
  });

  if (teamError) {
    return { error: 'Failed to create team', data: null };
  }

  await supabase(cookies).createTeamPlayer({
    team_id: team.id,
    player_id: owner.id,
    captain: true,
  });

  redirect(`/teams/${team.id}`);
  return { data: team, error: null };
}
