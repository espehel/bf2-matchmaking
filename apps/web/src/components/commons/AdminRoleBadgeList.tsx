import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  relevantRoles: Array<'player_admin' | 'match_admin' | 'server_admin' | 'system_admin'>;
}

export async function AdminRoleBadgeList({ relevantRoles }: Props) {
  const cookieStore = await cookies();
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();
  if (!adminRoles) {
    return null;
  }
  return (
    <ul className="flex w-fit gap-1">
      {relevantRoles
        .filter((role) => adminRoles[role])
        .map((role) => (
          <li className="badge badge-sm badge-accent capitalize" key={role}>
            {role.replace('_', ' ')}
          </li>
        ))}
    </ul>
  );
}
