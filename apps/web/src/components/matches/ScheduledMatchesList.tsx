import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { isScheduledMatch } from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import MatchDateItems from '@/components/matches/MatchDateItems';
import ScheduleMatchForm, {
  ScheduledMatchFormFallback,
} from '@/components/matches/ScheduleMatchForm';
import React, { Suspense } from 'react';

export default async function ScheduledMatchesList() {
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
    <section className="max-w-4xl m-auto mb-8">
      <div className="flex justify-between items-end mb-8">
        <h2 className="text-xl font-bold text-base-content">Scheduled matches</h2>
        <Suspense fallback={<ScheduledMatchFormFallback />}>
          <ScheduleMatchForm />
        </Suspense>
      </div>
      {!hasMatches && (
        <p className="flex items-center gap-8 px-8 border-2 border-primary rounded bg-base-100 h-28 text-xl">
          Currently no scheduled matches...
        </p>
      )}
      {hasMatches && (
        <ul className="grid justify-center gap-4">
          {matchDates.map((date) => (
            <MatchDateItems key={date} date={date} matches={scheduledMatches} />
          ))}
        </ul>
      )}
    </section>
  );
}
