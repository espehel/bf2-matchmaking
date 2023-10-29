import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import MatchActions from '@/components/match/MatchActions';
import Link from 'next/link';
import TeamSection from '@/components/match/TeamSection';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  match: MatchesJoined;
}

export default async function MatchSection({ match }: Props) {
  const isMatchOfficer = await supabase(cookies).isMatchOfficer(match);
  return (
    <section className="section w-fit">
      <div>
        <h2 className="text-xl">{`Match ${match.id} - ${match.status}`}</h2>
        {match.status !== MatchStatus.Scheduled && (
          <p className="text-sm text-gray font-bold">
            {`Rounds played: ${match.rounds.length}`}
          </p>
        )}
      </div>
      <div className="flex justify-center gap-8">
        <TeamSection match={match} team={match.home_team} />
        <div className="divider divider-horizontal">vs</div>
        <TeamSection match={match} team={match.away_team} />
      </div>
      {match.status === MatchStatus.Closed && (
        <Link className="btn btn-primary btn-lg btn-wide" href={`/results/${match.id}`}>
          Go to results
        </Link>
      )}
      {isMatchOfficer && (
        <Suspense fallback={null}>
          <MatchActions match={match} />
        </Suspense>
      )}
    </section>
  );
}
