import { hash } from '@bf2-matchmaking/redis/hash';
import { client } from '@bf2-matchmaking/supabase';

export async function getPlayerRoles(playerId: string) {
  const roles = await hash<Record<string, string>>('players:roles').get(playerId);
  if (roles) {
    return roles.split(',');
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
    .join(',');
  await hash<Record<string, string>>('players:roles').set({
    playerId: 'user'.concat(adminRoles),
  });

  return adminRoles.split(',');
}
