'use server';

import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { assertObj } from '@bf2-matchmaking/utils';
import { createToken } from '@bf2-matchmaking/auth/token';

export async function getPlayerToken() {
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();
  assertObj(player, 'Player not found');
  return createToken(player);
}
