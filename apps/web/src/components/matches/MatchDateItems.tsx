import { ScheduledMatch } from '@bf2-matchmaking/types';
import Link from 'next/link';
import ScheduledMatchCard from '@/components/ScheduledMatchCard';
import { DateTime } from 'luxon';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { Suspense } from 'react';

interface Props {
  date: string;
  matches: Array<ScheduledMatch>;
}

export default function MatchDateItems({ date, matches }: Props) {
  const thisDaysMatches = matches.filter(
    (match) => DateTime.fromISO(match.scheduled_at).toFormat('EEEE, MMMM d') === date
  );
  return (
    <>
      <li className="flex items-center gap-3 mb-3">
        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
        <span className="text-sm font-semibold uppercase tracking-wider text-base-content/70">
          {date}
        </span>
      </li>
      {thisDaysMatches.map((match) => (
        <li key={match.id} className="mb-3">
          <Suspense fallback={<Skeleton />}>
            <Link href={`/matches/${match.id}`}>
              <ScheduledMatchCard match={match} />
            </Link>
          </Suspense>
        </li>
      ))}
    </>
  );
}

function Skeleton() {
  return (
    <section className="flex items-center justify-between gap-8 px-8 py-4 rounded-lg bg-base-200 border border-base-300 shadow-sm animate-pulse">
      <div className="space-y-3">
        <div className="skeleton w-20 h-4 rounded" />
        <div className="skeleton w-16 h-8 rounded" />
      </div>
      <div className="space-y-3">
        <div className="skeleton w-32 h-4 rounded" />
        <div className="skeleton w-48 h-8 rounded" />
      </div>
      <div className="flex gap-2">
        <div className="skeleton w-20 h-16 rounded-lg" />
        <div className="skeleton w-20 h-16 rounded-lg" />
      </div>
    </section>
  );
}

