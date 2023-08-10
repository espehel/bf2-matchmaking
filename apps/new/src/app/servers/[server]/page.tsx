import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import { api } from '@bf2-matchmaking/utils';
import RoundTable from '@/components/RoundTable';
import ServerUpdateForm from '@/components/ServerUpdateForm';
import ServerInfoSection from '@/components/ServerInfoSection';

interface Props {
  params: { server: string };
}
export default async function ServerPage({ params }: Props) {
  const server = await supabase(cookies)
    .getServer(params.server)
    .then(verifySingleResult);

  const { data: serverInfo } = await api.rcon().getServerInfo(params.server);

  const { data: playerList } =
    serverInfo && parseInt(serverInfo.connectedPlayers) > 0
      ? await api.rcon().getServerPlayerList(params.server)
      : { data: null };

  return (
    <main className="main flex flex-col gap-6">
      <h1>Server details</h1>
      <section>
        <h2 className="text-xl">{server.name}</h2>
        <p className="font-bold mb-2">{`IP: ${server.ip}`}</p>
        <ServerUpdateForm server={server} />
      </section>
      <ServerInfoSection serverInfo={serverInfo} />
      {playerList && serverInfo && (
        <section>
          <RoundTable serverInfo={serverInfo} playerList={playerList} />
        </section>
      )}
    </main>
  );
}
