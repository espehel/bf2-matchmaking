import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import MatchActions from '@/components/matches/MatchActions';
import Link from 'next/link';
import TeamSection from '@/components/matches/TeamSection';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import SummoningSection from '@/components/matches/SummoningSection';
import { ArrowRightIcon } from '@heroicons/react/16/solid';

interface Props {
  match: MatchesJoined;
}

export default async function MatchSection({ match }: Props) {
  const cookieStore = await cookies();
  const isMatchOfficer = await supabase(cookieStore).isMatchOfficer(match);
  return (
    <section className="section w-fit h-fit">
      <h2 className="text-xl">{`Match ${match.id} - ${match.status}`}</h2>
      <TeamsContent match={match} />
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

function TeamsContent({ match }: { match: MatchesJoined }) {
  const isOpen =
    match.status === MatchStatus.Open || match.status === MatchStatus.Scheduled;

  if (match.config.type === 'Mix' && isOpen) {
    return (
      <div className="text-left">
        <ul className="list bg-base-200 rounded-md shadow-md shadow-base-300 w-sm">
          {match.players.map((player) => (
            <li className="list-row" key={player.id}>
              {player.nick}
            </li>
          ))}
        </ul>
        <Link href={`/matches/${match.id}/players`} className="btn btn-secondary mt-2">
          Manage players
          <ArrowRightIcon className="size-6" />
        </Link>
      </div>
    );
  }

  if (match.status === MatchStatus.Summoning) {
    return <SummoningSection match={match} />;
  }

  return (
    <div className="flex justify-center gap-8">
      <TeamSection match={match} team={match.home_team} />
      <div className="divider divider-horizontal">vs</div>
      <TeamSection match={match} team={match.away_team} />
    </div>
  );
}
