import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verify } from '@bf2-matchmaking/utils';
import ResultsSection from '@/components/players/ResultsSection';
import Loading from '@/app/matches/[match]/loading';
import { Suspense } from 'react';

interface Props {
  params: Promise<{ player: string }>;
}
export default async function PlayerPage(props: Props) {
  const params = await props.params;
  const cookieStore = await cookies();
  const player = await supabase(cookieStore).getPlayer(params.player).then(verify);
  const { data: sessionPlayer } = await supabase(cookieStore).getSessionPlayer();
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();

  const showResults = sessionPlayer?.id === player.id || adminRoles?.player_admin;

  return (
    <main className="main">
      <h1 className="mb-8">{player.nick}</h1>
      {showResults && (
        <Suspense fallback={<Loading />}>
          <ResultsSection player={player} />
        </Suspense>
      )}
    </main>
  );
}
