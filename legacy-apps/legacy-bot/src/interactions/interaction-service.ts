import { client } from '@bf2-matchmaking/supabase';
import { APIInteractionGuildMember } from 'discord.js';
import { logPlayerUpdated, logSupabaseError } from '@bf2-matchmaking/logging';

export const updatePlayerKeyHash = async (
  member: APIInteractionGuildMember,
  keyhash: string
) => {
  const player = await client().services.getOrCreatePlayer(member.user);
  const result = await client().updatePlayer(player.id, { keyhash });
  if (result.error) {
    logSupabaseError('Failed to updated keyhash', result.error);
  } else {
    logPlayerUpdated('Player keyhash updated', result.data, { keyhash });
  }
  return result;
};
