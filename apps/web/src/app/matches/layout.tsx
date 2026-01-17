import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { DateTime } from 'luxon';
import { supabase } from '@/lib/supabase/supabase-server';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { isScheduledMatch, MatchStatus } from '@bf2-matchmaking/types';
import MatchesSidebar from '@/components/matches/MatchesSidebar';

interface Props {
  children: React.ReactNode;
}

export default async function MatchesLayout({ children }: Props) {
  const cookieStore = await cookies();

  const scheduledMatches = await supabase(cookieStore)
    .getScheduledMatches(DateTime.now().set({ hour: 0, minute: 0 }).toISO())
    .then(verifyResult);

  const ongoingMatches = await supabase(cookieStore)
    .getMatchesWithStatus(MatchStatus.Ongoing, MatchStatus.Finished)
    .then(verifyResult);

  const scheduledCount = scheduledMatches.filter(isScheduledMatch).length;
  const ongoingCount = ongoingMatches.length;

  return (
    <div className="flex gap-8 max-w-6xl mx-auto px-4 py-8">
      <Suspense fallback={<div className="w-64 shrink-0" />}>
        <MatchesSidebar scheduledCount={scheduledCount} ongoingCount={ongoingCount} />
      </Suspense>
      {children}
    </div>
  );
}
