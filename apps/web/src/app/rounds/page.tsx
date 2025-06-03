import RoundLink from '@/components/RoundLink';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';

export default async function RoundsPage() {
  const cookieStore = await cookies();
  const rounds = await supabase(cookieStore).getRounds(20).then(verifyResult);

  return (
    <main className="main">
      <h1 className="mb-4">Rounds</h1>
      <ul>
        {rounds.map((round) => (
          <li key={round.id} className="mb-4">
            <RoundLink round={round} />
          </li>
        ))}
      </ul>
    </main>
  );
}
