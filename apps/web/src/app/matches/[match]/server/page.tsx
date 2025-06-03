import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import ServerInstancesSection from '@/components/matches-server/ServerInstancesSection';
import ActiveServerSection from '@/components/matches-server/ActiveServerSection';
import { Suspense } from 'react';
import ScheduledActionsSection from '@/components/matches-server/ScheduledActionsSection';
import { isScheduledMatch } from '@bf2-matchmaking/types';
import LoadingSection from '@/components/commons/LoadingSection';

interface Props {
  params: Promise<{ match: string }>;
}
export default async function ResultsMatch(props: Props) {
  const params = await props.params;
  const cookieStore = await cookies();
  const match = await supabase(cookieStore)
    .getMatch(Number(params.match))
    .then(verifySingleResult);
  const { data: matchServers } = await supabase(cookieStore).getMatchServers(
    Number(params.match)
  );

  return (
    <main className="main flex flex-col gap-6">
      <h1>{`Manage match ${match.id} servers`}</h1>
      <ActiveServerSection match={match} />
      {isScheduledMatch(match) && (
        <Suspense fallback={null}>
          <ScheduledActionsSection match={match} matchServer={matchServers} />
        </Suspense>
      )}
      <Suspense fallback={<LoadingSection />}>
        <ServerInstancesSection match={match} />
      </Suspense>
    </main>
  );
}
