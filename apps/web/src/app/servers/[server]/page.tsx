import { api, verify } from '@bf2-matchmaking/utils';
import ServerInteractionSection from '@/components/servers/ServerInteractions';
import ServerActions from '@/components/servers/ServerActions';
import ServerHeader from '@/components/servers/ServerHeader';

interface Props {
  params: { server: string };
}
export default async function ServerPage({ params }: Props) {
  const liveServer = await api.live().getServer(params.server).then(verify);

  return (
    <main className="main flex flex-col gap-6">
      <ServerHeader server={liveServer} />
      <ServerInteractionSection server={liveServer} />
      <ServerActions address={params.server} />
    </main>
  );
}
