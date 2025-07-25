import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';
import { MatchStatus } from '@bf2-matchmaking/types';
import MatchCard from '@/components/MatchCard';
import { api, compareStartedAt, verify } from '@bf2-matchmaking/utils';

export default async function PendingMatchesList() {
  const cookieStore = await cookies();
  const matches = await supabase(cookieStore)
    .getMatchesWithStatus(MatchStatus.Ongoing, MatchStatus.Finished)
    .then(verifyResult);
  const liveMatches = await api.v2.getMatches().then(verify);

  const pendingMatches = matches
    .filter((m) => !liveMatches.some(({ matchId }) => matchId === m.id))
    .sort(compareStartedAt);

  if (pendingMatches.length === 0) {
    return null;
  }

  return (
    <section className="max-w-4xl m-auto">
      <h2 className="mb-8 text-xl font-bold text-left text-base-content">
        Pending matches
      </h2>
      <ul>
        {pendingMatches.map((match) => (
          <li key={match.id} className="mb-4">
            <Link href={`/matches/${match.id}`}>
              <MatchCard match={match} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
