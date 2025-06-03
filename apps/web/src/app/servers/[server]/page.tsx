import { api, verify } from '@bf2-matchmaking/utils';
import ManageServerActions from '@/components/servers/ServerManageActions';
import ServerHeader from '@/components/servers/ServerHeader';
import ServerActions from '@/components/servers/ServerActions';
import ServerInGameActions from '@/components/servers/ServerInGameActions';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { isConnectedLiveServer } from '@bf2-matchmaking/types';
import ServerLog from '@/components/servers/ServerLog';

interface Props {
  params: Promise<{ server: string }>;
}
export default async function ServerPage(props: Props) {
  const params = await props.params;
  const liveServer = await api.v2.getServer(params.server).then(verify);

  const cookieStore = await cookies();
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();
  const hasAdmin = Boolean(adminRoles?.server_admin);

  const { data: player } = await supabase(cookieStore).getSessionPlayer();
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
      <div className="flex gap-6">
        <ManageServerActions address={params.server} />
        {hasAdmin && <ServerLog address={params.server} />}
      </div>
    </main>
  );
}
