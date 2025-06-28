'use server';

import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { isString, PlayersRow } from '@bf2-matchmaking/types';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import { info } from '@bf2-matchmaking/logging';
import { assertString } from '@bf2-matchmaking/utils';
import { getDiscordUser } from '@bf2-matchmaking/discord';

export async function setTeamCaptain(teamId: number, playerId: string, value: boolean) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).updateTeamPlayer(teamId, playerId, {
    captain: value,
  });

  if (!result.error) {
    revalidatePath(`/teams/${teamId}`);
  }

  return result;
}
export async function addTeamPlayer(playerId: string, teamId: number) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).createTeamPlayer({
    player_id: playerId,
    team_id: teamId,
  });

  if (!result.error) {
    revalidatePath(`/teams/${teamId}`);
  }

  return result;
}

export async function removeTeamPlayer(teamId: number, playerId: string) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).deleteTeamPlayer(teamId, playerId);
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
    const cookieStore = await cookies();
    const result = await supabase(cookieStore).updateTeam(teamId, {
      name,
      owner,
      discord_role,
    });
    if (!result.error) {
      revalidatePath(`/teams/${teamId}`);
    }

    return result;
  }
  return { data: null, error: { message: 'Invalid form data' } };
}

export async function createAndAddPlayer(teamId: number, data: FormData) {
  const id = data.get('playerId');
  assertString(id, 'No player id');

  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getPlayer(id);
  if (player) {
    return createTeamPlayer(teamId, player.id);
  }

  const { data: user } = await getDiscordUser(id);
  if (!user) {
    return { error: { message: 'User not found' }, data: null };
  }
  const newPlayer = await supabase(cookieStore)
    .createPlayer({
      id,
      nick: user.username,
      avatar_url: user.avatar || '',
    })
    .then(verifySingleResult);
  return createTeamPlayer(teamId, newPlayer.id);
}

async function createTeamPlayer(team_id: number, player_id: string) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).createTeamPlayer({
    team_id,
    player_id,
  });
  if (result.data) {
    revalidatePath(`/teams/${team_id}`);
  }
  return result;
}

export async function activateTeam(teamId: number) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).updateTeam(teamId, { active: true });
  if (!result.error) {
    revalidatePath(`/teams`);
  }
  return result;
}

export async function deactivateTeam(teamId: number) {
  const cookieStore = await cookies();
  const result = await supabase(cookieStore).updateTeam(teamId, { active: false });
  if (!result.error) {
    revalidatePath(`/teams`);
  }
  return result;
}
