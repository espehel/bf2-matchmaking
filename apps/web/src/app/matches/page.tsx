import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';
import { MatchStatus } from '@bf2-matchmaking/types';
import OngoingMatchCard from '@/components/OngoingMatchCard';

export default async function MatchesPage() {
  const matches = await supabase(cookies).getMatches().then(verifyResult);
  const displayMatches = matches
    .filter((m) => m.status === MatchStatus.Ongoing)
    .sort((a, b) => b.id - a.id);

  const hasOngoingMatches = displayMatches.length > 0;

  return (
    <main className="main text-center">
      <h1 className="mb-8">Ongoing matches</h1>
      {!hasOngoingMatches && <p>Currently no ongoing matches...</p>}
      {hasOngoingMatches && (
        <ul className="grid justify-center gap-4">
          {displayMatches.map((match) => (
            <li className="" key={match.id}>
              <Link href={`/matches/${match.id}`}>
                <OngoingMatchCard match={match} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
