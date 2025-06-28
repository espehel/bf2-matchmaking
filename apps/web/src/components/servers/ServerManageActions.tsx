import ServerUpdateForm from '@/components/servers/ServerUpdateForm';
import ActionButton from '@/components/ActionButton';
import { deleteServer } from '@/app/servers/[server]/actions';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';

interface Props {
  address: string;
}

export default async function ServerManageActions({ address }: Props) {
  const cookieStore = await cookies();
  const server = await supabase(cookieStore).getServer(address).then(verifySingleResult);
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();
  async function deleteServerSA() {
    'use server';
    return deleteServer(server.ip);
  }

  if (!adminRoles?.server_admin) {
    return null;
  }

  return (
    <section className="section grow">
      <h2>Manage server</h2>
      <div>
        <ActionButton
          action={deleteServerSA}
          successMessage={`Deleted server ${server.name}`}
          errorMessage={'Failed to delete server'}
          kind="btn-error"
          redirect="/servers"
        >
          Delete server
        </ActionButton>
      </div>
      <ServerUpdateForm server={server} />
    </section>
  );
}
