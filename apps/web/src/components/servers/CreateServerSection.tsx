import ServerCreateForm from '@/components/servers/ServerCreateForm';
import GenerateServerForm from '@/components/servers/GenerateServerForm';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { api } from '@bf2-matchmaking/utils';

interface Props {}

export default async function CreateServerSection({}: Props) {
  const { data: player } = await supabase(cookies).getSessionPlayer();

  if (!player) {
    return null;
  }

  const { data: adminRoles } = await supabase(cookies).getAdminRoles();
  const { data: regions } = await api.platform().getLocations();

  return (
    <section className="bg-base-100 border-primary border-2 rounded p-4 mt-6">
      <h2 className="text-xl">Add server</h2>
      <ServerCreateForm />
      {adminRoles?.server_admin && regions && (
        <>
          <div className="divider" />
          <GenerateServerForm regions={regions} />
        </>
      )}
    </section>
  );
}
