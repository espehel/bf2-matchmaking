import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';

export default async function LeaguesPage() {
  const configs = await supabase(cookies).getMatchConfigs().then(verifyResult);
  const leagues = configs.filter((c) => c.type === 'League');
  return (
    <main className="main">
      <h1>Active leagues</h1>
      <ul className="menu menu-lg">
        {leagues.map((league) => (
          <li key={league.id}>
            <Link href={`/results/leagues/${league.id}`}>{league.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
