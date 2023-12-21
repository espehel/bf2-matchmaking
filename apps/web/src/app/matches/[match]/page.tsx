import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import MatchSection from '@/components/match/MatchSection';
import ServerSection from '@/components/match/ServerSection';
import LiveSection from '@/components/match/LiveSection';
import RoundsList from '@/components/RoundsList';
import { Suspense } from 'react';
import ServerSectionLoading from '@/components/match/ServerSectionLoading';
import MapsSection from '@/components/match/MapsSection';
import MatchTimeForm, { MatchTimeFallback } from '@/components/match/MatchTimeForm';

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
  const date = match.scheduled_at || match.started_at || match.created_at;

  return (
    <main className="main flex flex-col items-center text-center">
      <div className="mb-8">
        <h1 className="text-accent font-bold">{`${match.config.name}`}</h1>
        <Suspense fallback={<MatchTimeFallback match={match} />}>
          <MatchTimeForm match={match} />
        </Suspense>
      </div>
      <div className="flex flex-wrap gap-8 justify-center w-full">
        <MatchSection match={match} />
        {matchServer && (
          <Suspense
            fallback={<ServerSectionLoading match={match} matchServer={matchServer} />}
          >
            <ServerSection matchServer={matchServer} match={match} />
          </Suspense>
        )}
        <MapsSection match={match} key={match.maps.map((m) => m.id).join()} />
        <Suspense fallback={null}>
          <LiveSection match={match} />
        </Suspense>
        <div className="divider" />
        <RoundsList
          rounds={[...match.rounds].sort((a, b) =>
            a.created_at.localeCompare(b.created_at)
          )}
        />
      </div>
    </main>
  );
}
