import { api, verify } from '@bf2-matchmaking/utils';
import RoundTable from '@/components/RoundTable';
import ServerUpdateForm from '@/components/ServerUpdateForm';
import ServerInfoSection from '@/components/ServerInfoSection';
import UpdateServerNameForm from '@/components/UpdateServerNameForm';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  params: { server: string };
}
export default async function ServerPage({ params }: Props) {
  const server = await api.rcon().getServer(params.server).then(verify);
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();

  return (
    <main className="main flex flex-col gap-6">
      <h1>Server details</h1>
      <section>
        <div className="flex items-center">
          <h2 className="text-xl">{server.name}</h2>
          {server.info && adminRoles?.server_admin && (
            <UpdateServerNameForm server={server} info={server.info} />
          )}
        </div>
        <p className="font-bold mb-2">{`IP: ${server.ip}`}</p>
        {adminRoles?.server_admin && <ServerUpdateForm server={server} />}
      </section>
      <ServerInfoSection serverInfo={server.info} />
      {server.info && server.info.players.length > 0 && (
        <section>
          <RoundTable liveInfo={server.info} />
        </section>
      )}
    </main>
  );
}
