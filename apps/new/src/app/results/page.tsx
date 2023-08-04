import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';
import { MatchStatus } from '@bf2-matchmaking/types';
import MatchResultCard from '@/components/MatchResultCard';

export default async function Results() {
  const matches = await supabase(cookies).getMatches().then(verifyResult);
  const displayMatches = matches
    .filter((m) => m.status === MatchStatus.Closed)
    .sort((a, b) => b.id - a.id);

  return (
    <main className="main text-center">
      <h1 className="mb-8">Match Results</h1>
      <ul className="grid justify-center gap-4">
        {displayMatches.map((match) => (
          <li className="" key={match.id}>
            <Link href={`/results/${match.id}`}>
              <MatchResultCard match={match} />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
