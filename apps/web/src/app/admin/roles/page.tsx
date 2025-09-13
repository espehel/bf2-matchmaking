import { verifyResult } from '@bf2-matchmaking/supabase';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { isAdminPlayer } from '@bf2-matchmaking/types';
import ToggleAdminRolesInput from '@/components/admin/ToggleAdminRoleInput';
import IconBtn from '@/components/commons/IconBtn';
import { XCircleIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { deleteAdminRole, insertAdminRole } from '@/app/admin/roles/actions';
import PlayerCombobox from '@/components/PlayerCombobox';
import ActionForm from '@/components/form/ActionForm';
import FormSubmitButton from '@/components/FormSubmitButton';
import TransitionWrapper from '@/components/commons/TransitionWrapper';

export default async function AdminRolesPage() {
  const cookieStore = await cookies();
  const admins = await supabase(cookieStore).getAdmins().then(verifyResult);
  const sortedAdmins = admins
    .filter(isAdminPlayer)
    .sort((a, b) => a.player.nick.localeCompare(b.player.nick));

  return (
    <main className="main">
      <h1>Admin Roles</h1>
      <p className="mb-8">You must be system admin to be able to change roles</p>
      <ActionForm
        formAction={insertAdminRole}
        successMessage="Admin added"
        errorMessage="Failed to add admin"
        className="mb-4"
      >
        <PlayerCombobox />
        <FormSubmitButton>Add</FormSubmitButton>
      </ActionForm>
      <ul className="grid grid-cols-6 items-center p-8 bg-base-100 rounded text-center">
        <li className="contents text-lg font-bold">
          <div className="text-left">Player</div>
          <div>Match</div>
          <div>Server</div>
          <div>Player</div>
          <div>System</div>
          <div>Delete</div>
        </li>
        {sortedAdmins.map((admin) => (
          <li key={admin.user_id} className="contents group">
            <div className="group-hover:bg-base-300 p-2 text-left">
              {admin.player.nick}
            </div>
            <ToggleAdminRolesInput role="match_admin" user={admin} />
            <ToggleAdminRolesInput role="server_admin" user={admin} />
            <ToggleAdminRolesInput role="player_admin" user={admin} />
            <ToggleAdminRolesInput role="system_admin" user={admin} />
            <ActionForm
              className="group-hover:bg-base-300 p-2"
              formAction={deleteAdminRole}
              successMessage="Admin deleted"
              errorMessage="Failed to delete admin"
              extras={{ user_id: admin.user_id }}
            >
              <TransitionWrapper>
                <IconBtn
                  type="submit"
                  Icon={XCircleIcon}
                  size="xs"
                  className="text-error"
                />
              </TransitionWrapper>
            </ActionForm>
          </li>
        ))}
      </ul>
    </main>
  );
}
