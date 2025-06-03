import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import MatchSection from '@/components/matches/MatchSection';
import MatchServerSection from '@/components/matches/server/MatchServerSection';
import LiveSection from '@/components/matches/LiveSection';
import RoundsList from '@/components/RoundsList';
import { Suspense } from 'react';
import ServerSectionLoading from '@/components/matches/server/ServerSectionLoading';
import MatchTimeForm, { MatchTimeFallback } from '@/components/matches/MatchTimeForm';
import { isActiveMatch } from '@bf2-matchmaking/utils';
import ChallengeSection from '@/components/matches/ChallengeSection';

interface Props {
  params: Promise<{ match: string }>;
}
export default async function ResultsMatch(props: Props) {
  const params = await props.params;
  const cookieStore = await cookies();
  const match = await supabase(cookieStore)
    .getMatch(Number(params.match))
    .then(verifySingleResult);

  //TODO: add server restart to match server view

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
        <div className="flex flex-col gap-2">
          {match.config.type === 'Ladder' && <ChallengeSection match={match} />}
          {isActiveMatch(match) && (
            <Suspense fallback={<ServerSectionLoading />}>
              <MatchServerSection match={match} />
            </Suspense>
          )}
        </div>
        {/*<MapsSection match={match} key={match.maps.map((m) => m.id).join()} />*/}
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
