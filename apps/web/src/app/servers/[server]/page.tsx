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
  const liveServer = await api.live().getServer(params.server).then(verify);
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();

  return (
    <main className="main flex flex-col gap-6">
      <h1>Server details</h1>
      <section className="section">
        <div className="flex items-center">
          <h2 className="text-xl">{liveServer.info.serverName}</h2>
        </div>
        <div className="flex gap-4 font-bold mb-2">
          <p>{`Address: ${liveServer.address}`}</p>
          <p>{`Updated: ${
            liveServer.updatedAt
              ? DateTime.fromISO(liveServer.updatedAt).toFormat('DDD, T')
              : '-'
          }`}</p>
          <p>{`Server location: ${liveServer.city}, ${liveServer.country}`}</p>
        </div>
      </section>
      <ServerInfoSection server={liveServer} />
      {adminRoles?.server_admin && <ServerActions address={params.server} />}
      {liveServer.info && liveServer.info.players.length > 0 && (
        <section>
          <RoundTable liveInfo={liveServer.info} />
        </section>
      )}
    </main>
  );
}
