import { ScheduledMatch } from '@bf2-matchmaking/types';
import Link from 'next/link';
import ScheduledMatchCard from '@/components/ScheduledMatchCard';
import { DateTime } from 'luxon';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

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
          <Link href={`/matches/${match.id}`}>
            <ScheduledMatchCard match={match} />
          </Link>
        </li>
      ))}
    </>
  );
}
