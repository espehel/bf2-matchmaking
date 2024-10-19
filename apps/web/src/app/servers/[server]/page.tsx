import { api, verify } from '@bf2-matchmaking/utils';
import ManageServerActions from '@/components/servers/ServerManageActions';
import ServerHeader from '@/components/servers/ServerHeader';
import ServerActions from '@/components/servers/ServerActions';
import ServerInGameActions from '@/components/servers/ServerInGameActions';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { isConnectedLiveServer } from '@bf2-matchmaking/types';

interface Props {
  params: { server: string };
}
export default async function ServerPage({ params }: Props) {
  const liveServer = await api.v2.getServer(params.server).then(verify);

  const { data: adminRoles } = await supabase(cookies).getAdminRoles();
  const hasAdmin = Boolean(adminRoles?.server_admin);

  const { data: player } = await supabase(cookies).getSessionPlayer();
  const isConnected =
    player && liveServer.live
      ? liveServer.live.players.some((p) => p.keyhash === player.keyhash)
      : false;

  return (
    <main className="main flex flex-col gap-6">
      <ServerHeader server={liveServer} isConnected={isConnected} hasAdmin={hasAdmin} />
      <div className="flex gap-6">
        <ServerActions server={liveServer} hasAdmin={hasAdmin} />
        {isConnectedLiveServer(liveServer) && (
          <ServerInGameActions
            server={liveServer}
            isConnected={isConnected}
            hasAdmin={hasAdmin}
          />
        )}
      </div>
      <ManageServerActions address={params.server} />
    </main>
  );
}
