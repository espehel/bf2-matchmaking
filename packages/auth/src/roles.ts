import { hash } from '@bf2-matchmaking/redis/hash';
import { client } from '@bf2-matchmaking/supabase';
import { AccessRoles } from '@bf2-matchmaking/types';

export async function getPlayerRoles(playerId: string): Promise<Array<AccessRoles>> {
  const roles = await hash<Record<string, string>>('players:roles').get(playerId);
  if (roles) {
    return roles.split(',') as Array<AccessRoles>;
  }

  const { data: player } = await client().getPlayer(playerId);
  if (!player || !player.user_id) {
    return [];
  }
  const { data } = await client().getAdminRoles(player.user_id);
  if (!data) {
    return [];
  }

  const { created_at, user_id, updated_at, ...rolesData } = data;
  const adminRoles = Object.entries(rolesData)
    .filter(([_, hasRole]) => hasRole)
    .map(([roleName]) => roleName)
    .concat('user')
    .join(',');
  await hash<Record<string, string>>('players:roles').set({
    [playerId]: adminRoles,
  });

  return adminRoles.split(',') as Array<AccessRoles>;
}
