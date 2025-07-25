import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';
import { MatchResultsJoined } from '@bf2-matchmaking/types';
import MatchResultCard from '@/components/MatchResultCard';
import { toTuple } from '@bf2-matchmaking/utils';

export default async function Results() {
  const cookieStore = await cookies();
  const results = await supabase(cookieStore).getMatchResults().then(verifyResult);
  const matches = await supabase(cookieStore)
    .getMatchesInIdList(results.map((m) => m.match_id))
    .then(verifyResult);

  const groupedByMatchid = results.reduce<Record<number, Array<MatchResultsJoined>>>(
    (acc, cur) => {
      return { ...acc, [cur.match_id]: [...(acc[cur.match_id] || []), cur] };
    },
    {}
  );

  function getMatchRounds(matchId: string) {
    return matches.find((m) => m.id === Number(matchId))?.rounds || [];
  }

  return (
    <main className="main text-center">
      <h1 className="mb-8">Match Results</h1>
      <ul className="grid justify-center gap-4">
        {Object.entries(groupedByMatchid)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([matchId, match]) => (
            <li className="" key={matchId}>
              <Link href={`/results/${matchId}`}>
                <MatchResultCard
                  matchId={matchId}
                  matchResult={toTuple(match)}
                  rounds={getMatchRounds(matchId)}
                />
              </Link>
            </li>
          ))}
      </ul>
    </main>
  );
}
