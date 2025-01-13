import { verifyResult } from '@bf2-matchmaking/supabase';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { isAdminPlayer } from '@bf2-matchmaking/types';

export default async function AdminRolesPage() {
  const admins = await supabase(cookies).getAdmins().then(verifyResult);
  return (
    <main className="main">
      <h1>Admin Roles</h1>
      <ul>
        {admins.filter(isAdminPlayer).map((admin) => (
          <li key={admin.user_id}>
            <div>{admin.player.nick}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
