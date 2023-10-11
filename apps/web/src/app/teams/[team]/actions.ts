'use server';

import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { isString } from '@bf2-matchmaking/types';
import { redirect } from 'next/navigation';

export async function setTeamCaptain(teamId: number, playerId: string, value: boolean) {
  const result = await supabase(cookies).updateTeamPlayer(teamId, playerId, {
    captain: value,
  });

  if (!result.error) {
    revalidatePath(`/teams/${teamId}`);
  }

  return result;
}
export async function addTeamPlayer(playerId: string, teamId: number) {
  const result = await supabase(cookies).createTeamPlayer({
    player_id: playerId,
    team_id: teamId,
  });

  if (!result.error) {
    revalidatePath(`/teams/${teamId}`);
  }

  return result;
}

export async function removeTeamPlayer(teamId: number, playerId: string) {
  const result = await supabase(cookies).deleteTeamPlayer(teamId, playerId);
  if (!result.error) {
    revalidatePath(`/teams/${teamId}`);
  }

  return result;
}

export async function updateTeam(teamId: number, data: FormData) {
  const name = data.get('name');
  const discordRole = data.get('discord_role');
  const owner = data.get('player[id]');
  if (isString(name) && isString(owner)) {
    const discord_role = isString(discordRole) ? discordRole : null;
    const result = await supabase(cookies).updateTeam(teamId, {
      name,
      owner,
      discord_role,
    });
    if (!result.error) {
      redirect(`/teams/${teamId}`);
    }

    return result;
  }
  return { data: null, error: { message: 'Invalid form data' } };
}
