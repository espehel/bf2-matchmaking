import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verify } from '@bf2-matchmaking/utils';
import ResultsSection from '@/components/players/ResultsSection';
import Loading from '@/app/matches/[match]/loading';
import { Suspense } from 'react';

interface Props {
  params: { player: string };
}
export default async function PlayerPage({ params }: Props) {
  const player = await supabase(cookies).getPlayer(params.player).then(verify);
  const { data: sessionPlayer } = await supabase(cookies).getSessionPlayer();
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();

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
