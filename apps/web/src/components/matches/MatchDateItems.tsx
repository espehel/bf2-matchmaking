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
      <li className="font-extrabold text-left">{date}</li>
      {thisDaysMatches.map((match) => (
        <li key={match.id}>
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
    <section className="flex items-center justify-between gap-8 px-8 border-2 border-primary rounded bg-base-100">
      <div>
        <div className="skeleton w-24 h-6 rounded shrink-0 m-4"></div>
        <div className="skeleton w-24 h-12 rounded shrink-0 m-4"></div>
      </div>
      <div>
        <div className="skeleton w-80 h-6 rounded shrink-0 m-4"></div>
        <div className="skeleton w-80 h-12 rounded shrink-0 m-4"></div>
      </div>
      <div>
        <div className="skeleton w-24 h-6 rounded shrink-0 m-4"></div>
        <div className="skeleton w-24 h-12 rounded shrink-0 m-4"></div>
      </div>
    </section>
  );
}
