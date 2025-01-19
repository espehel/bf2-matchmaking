'use client';
import { AdminPlayer } from '@bf2-matchmaking/types';
import { setAdminRole } from '@/app/admin/roles/actions';

interface Props {
  role: 'match_admin' | 'system_admin' | 'player_admin' | 'server_admin';
  user: AdminPlayer;
}

export default function ToggleAdminRolesInput({ role, user }: Props) {
  const handleChange = async () => {
    await setAdminRole(role, user.user_id, !user[role]);
  };
  return (
    <div className="group-hover:bg-base-300 p-2">
      <input
        type="checkbox"
        className="toggle toggle-success"
        onChange={handleChange}
        checked={user[role] as boolean}
      />
    </div>
  );
}
