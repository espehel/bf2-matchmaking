import { api, verify } from '@bf2-matchmaking/utils';
import RoundTable from '@/components/RoundTable';
import ServerInfoSection from '@/components/servers/ServerInfoSection';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import ServerActions from '@/components/servers/ServerActions';
import { DateTime } from 'luxon';

interface Props {
  params: { server: string };
}
export default async function ServerPage({ params }: Props) {
  const server = await api.rcon().getServer(params.server).then(verify);
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();

  return (
    <main className="main flex flex-col gap-6">
      <h1>Server details</h1>
      <section className="section">
        <div className="flex items-center">
          <h2 className="text-xl">{server.name}</h2>
        </div>
        <div className="flex gap-4 font-bold mb-2">
          <p>{`Address: ${server.ip}`}</p>
          <p>{`Created: ${DateTime.fromISO(server.created_at).toFormat('DDD, T')}`}</p>
          <p>{`Server location: ${server.city}, ${server.country}`}</p>
        </div>
      </section>
      <ServerInfoSection server={server} />
      {adminRoles?.server_admin && <ServerActions server={server} />}
      {server.info && server.info.players.length > 0 && (
        <section>
          <RoundTable liveInfo={server.info} />
        </section>
      )}
    </main>
  );
}
