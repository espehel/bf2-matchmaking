import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { isScheduledMatch } from '@bf2-matchmaking/types';
import moment from 'moment';
import MatchDateItems from '@/components/match/MatchDateItems';

export default async function ScheduledMatchesPage() {
  const matches = await supabase(cookies)
    .getScheduledMatches(moment().toISOString())
    .then(verifyResult);
  const scheduledMatches = matches
    .filter(isScheduledMatch)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const matchDates = [...new Set(scheduledMatches.map((match) => match.scheduled_at))];

  const hasMatches = matchDates.length > 0;

  return (
    <main className="main text-center">
      <h1 className="mb-8">Scheduled matches</h1>
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
