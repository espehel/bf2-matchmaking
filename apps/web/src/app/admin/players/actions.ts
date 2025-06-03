'use server';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { listGuildMembers } from '@bf2-matchmaking/discord';

export async function addBetaPlayers(players: Array<string>) {
  const cookieStore = await cookies();
  await Promise.all(
    players.map((player) =>
      supabase(cookieStore).updatePlayer(player, { beta_tester: true })
    )
  );
}

export async function getBetaPlayers(
  guildId: string,
  roleId: string
): Promise<Array<[string, string]>> {
  const { data } = await listGuildMembers(guildId);
  if (data) {
    return data
      .filter((member) => member.roles.includes(roleId))
      .map((member) => [member.user?.id || '', member.nick || '']);
  }
  return [];
}
