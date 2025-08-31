'use server';
import { getValues } from '@bf2-matchmaking/utils/form';
import { players } from '@/lib/supabase/supabase-server';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import { parseError } from '@bf2-matchmaking/services/error';
import { ActionResult } from '@/lib/types/form';

export async function registerTeamspeakId(data: FormData): Promise<ActionResult> {
  try {
    const { teamspeakId, playerId } = getValues(data, 'teamspeakId', 'playerId');
    const player = await players
      .update(playerId, { teamspeak_id: teamspeakId })
      .then(verifySingleResult);
    return {
      success: `Teamspeak ID registered for ${player.nick}`,
      ok: true,
      error: null,
    };
  } catch (e) {
    return {
      success: null,
      ok: false,
      error: `Failed to register teamspeak id (${parseError(e)})`,
    };
  }
}

export async function registerKeyhash(data: FormData): Promise<ActionResult> {
  try {
    const { keyhash, playerId } = getValues(data, 'keyhash', 'playerId');
    const player = await players.update(playerId, { keyhash }).then(verifySingleResult);
    return {
      success: `Keyhash registered for ${player.nick}`,
      ok: true,
      error: null,
    };
  } catch (e) {
    return {
      success: null,
      ok: false,
      error: `Failed to register keyhash (${parseError(e)})`,
    };
  }
}
