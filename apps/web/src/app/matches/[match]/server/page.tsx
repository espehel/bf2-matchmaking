import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import ServerInstancesSection from '@/components/matches-server/ServerInstancesSection';
import ActiveServerSection from '@/components/matches-server/ActiveServerSection';
import { Suspense } from 'react';
import ScheduledActionsSection from '@/components/matches-server/ScheduledActionsSection';
import { isScheduledMatch } from '@bf2-matchmaking/types';

interface Props {
  params: { match: string };
}
export default async function ResultsMatch({ params }: Props) {
  const match = await supabase(cookies)
    .getMatch(Number(params.match))
    .then(verifySingleResult);
  const { data: matchServer } = await supabase(cookies).getMatchServers(
    Number(params.match)
  );
  // TODO: Find active live server
  return (
    <main className="main flex flex-col gap-6">
      <h1>{`Manage match ${match.id} servers`}</h1>
      <ActiveServerSection match={match} server={null} />
      {isScheduledMatch(match) && (
        <Suspense fallback={null}>
          <ScheduledActionsSection match={match} matchServer={matchServer} />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <ServerInstancesSection match={match} />
      </Suspense>
    </main>
  );
}
