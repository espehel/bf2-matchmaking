import { MatchesJoined, MatchTeam } from '@bf2-matchmaking/types';
import { isTeam } from '@bf2-matchmaking/utils';
import { PublicMatchRole } from '@bf2-matchmaking/schemas/types';
import { matches } from '@/lib/supabase/supabase-server';
import { verifyResult } from '@bf2-matchmaking/supabase';
import RoleAvatar from '@/components/commons/RoleAvatar';

interface Props {
  match: MatchesJoined;
  team: MatchTeam;
}

export default async function UnfilledRolesListitems({ match, team }: Props) {
  const roles = await matches.roles.get(match.id).then(verifyResult);
  const filledRoles = match.teams
    .filter(isTeam(team.id))
    .map((mp) => mp.role)
    .reduce(
      (acc, role) => (role ? { ...acc, [role]: (acc[role] || 0) + 1 } : acc),
      {} as Record<PublicMatchRole, number>
    );
  const unfilledRoles = roles
    .map((role) => [role.name, role.count - (filledRoles[role.name] || 0)] as const)
    .filter(([, count]) => count > 0)
    .flatMap(([role, count]) => Array.from({ length: count }, () => role));
  return (
    <>
      {unfilledRoles.map((role, i) => (
        <li key={`${role}${i}`} className="flex gap-2 items-center w-52">
          <RoleAvatar role={role} />
          {role}
        </li>
      ))}
    </>
  );
}
