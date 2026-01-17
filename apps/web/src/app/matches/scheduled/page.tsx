import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { DateTime } from 'luxon';
import { supabase } from '@/lib/supabase/supabase-server';
import { verifyResult } from '@bf2-matchmaking/supabase';
import LoadingSection from '@/components/commons/LoadingSection';
import ScheduledMatchesContent from '@/components/matches/ScheduledMatchesContent';

export default async function ScheduledMatchesPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Scheduled Matches</h1>
      <Suspense fallback={<LoadingSection />}>
        <ScheduledMatchesPageContent />
      </Suspense>
    </div>
  );
}

async function ScheduledMatchesPageContent() {
  const cookieStore = await cookies();

  const scheduledMatches = await supabase(cookieStore)
    .getScheduledMatches(DateTime.now().set({ hour: 0, minute: 0 }).toISO())
    .then(verifyResult);

  return <ScheduledMatchesContent matches={scheduledMatches} />;
}
