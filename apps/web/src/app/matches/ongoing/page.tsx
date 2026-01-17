import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/supabase-server';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { MatchStatus } from '@bf2-matchmaking/types';
import { api, verify } from '@bf2-matchmaking/utils';
import LoadingSection from '@/components/commons/LoadingSection';
import OngoingMatchesContent from '@/components/matches/OngoingMatchesContent';

export default async function OngoingMatchesPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Ongoing Matches</h1>
      <Suspense fallback={<LoadingSection />}>
        <OngoingMatchesPageContent />
      </Suspense>
    </div>
  );
}

async function OngoingMatchesPageContent() {
  const cookieStore = await cookies();

  const ongoingMatches = await supabase(cookieStore)
    .getMatchesWithStatus(MatchStatus.Ongoing, MatchStatus.Finished)
    .then(verifyResult);

  const liveMatches = await api.v2.getMatches().then(verify);

  return <OngoingMatchesContent matches={ongoingMatches} liveMatches={liveMatches} />;
}
