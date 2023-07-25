import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';

export default async function Results() {
  const matches = await supabase(cookies).getMatches().then(verifyResult);
  const displayMatches = matches
    .filter((m) => m.status !== 'Deleted')
    .sort((a, b) => b.id - a.id);

  return (
    <main className="main text-center">
      <h1>Matches</h1>
      <ul>
        {displayMatches.map((match) => (
          <li key={match.id}>
            <Link
              href={`/results/${match.id}`}
            >{`Match ${match.id} - ${match.status}`}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
