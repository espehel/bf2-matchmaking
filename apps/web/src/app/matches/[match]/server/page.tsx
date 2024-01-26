import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import InstanceSection from '@/components/matches-server/InstanceSection';
import ServerActionsSection from '@/components/matches-server/ServerActionsSection';
import ServerSection from '@/components/matches-server/ServerSection';
import { Suspense } from 'react';
import ScheduledActionsSection from '@/components/matches-server/ScheduledActionsSection';
import { isScheduledMatch, MatchStatus } from '@bf2-matchmaking/types';

interface Props {
  params: { match: string };
}
export default async function ResultsMatch({ params }: Props) {
  const match = await supabase(cookies)
    .getMatch(Number(params.match))
    .then(verifySingleResult);
  const { data: matchServer } = await supabase(cookies).getMatchServer(
    Number(params.match)
  );
  return (
    <main className="main flex flex-col gap-6">
      <h1>{`Manage match ${match.id} servers`}</h1>
      <ServerSection match={match} matchServer={matchServer} />
      {isScheduledMatch(match) && (
        <Suspense fallback={null}>
          <ScheduledActionsSection match={match} matchServer={matchServer} />
        </Suspense>
      )}
      <Suspense fallback={null}>
        <InstanceSection match={match} matchServer={matchServer} />
      </Suspense>
    </main>
  );
}
