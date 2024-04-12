import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { isScheduledMatch } from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import MatchDateItems from '@/components/matches/MatchDateItems';
import ScheduleMatchForm, {
  ScheduledMatchFormFallback,
} from '@/components/matches/ScheduleMatchForm';
import { Suspense } from 'react';

export default async function ScheduledMatchesPage() {
  const matches = await supabase(cookies)
    .getScheduledMatches(DateTime.now().set({ hour: 0, minute: 0 }).toISO())
    .then(verifyResult);
  const scheduledMatches = matches
    .filter(isScheduledMatch)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const matchDates = [
    ...new Set(
      scheduledMatches.map((match) =>
        DateTime.fromISO(match.scheduled_at).toFormat('EEEE, MMMM d')
      )
    ),
  ];
  const hasMatches = matchDates.length > 0;

  return (
    <main className="main">
      <h1 className="mb-8">Scheduled matches</h1>
      <div className="mb-8">
        <Suspense fallback={<ScheduledMatchFormFallback />}>
          <ScheduleMatchForm />
        </Suspense>
      </div>
      {!hasMatches && <p>Currently no scheduled matches...</p>}
      {hasMatches && (
        <ul className="grid justify-center gap-4">
          {matchDates.map((date) => (
            <MatchDateItems key={date} date={date} matches={scheduledMatches} />
          ))}
        </ul>
      )}
    </main>
  );
}
