import ServerUpdateForm from '@/components/servers/ServerUpdateForm';
import ActionButton from '@/components/ActionButton';
import { deleteServer } from '@/app/servers/[server]/actions';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';

interface Props {
  address: string;
}

export default async function ServerActions({ address }: Props) {
  const server = await supabase(cookies).getServer(address).then(verifySingleResult);
  async function deleteServerSA() {
    'use server';
    return deleteServer(server.ip);
  }

  return (
    <section className="section">
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
