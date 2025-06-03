'use server';

import { PlayersUpdate } from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

export async function updatePlayerByUserId(userId: string, values: PlayersUpdate) {
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getPlayerByUserId(userId);

  if (!player) {
    return { data: null, error: 'No player match user id' };
  }

  const { data, error } = await supabase(cookieStore).updatePlayer(player.id, values);

  if (error?.code === '23505') {
    return { data: null, error: 'Keyhash already exists on a player' };
  }

  if (error) {
    return { data: null, error: 'Failed to updated player key hash' };
  }

  return { data, error: null };
}
