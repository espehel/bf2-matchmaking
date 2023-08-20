import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import MatchSection from '@/components/match/MatchSection';
import ServerSection from '@/components/match/ServerSection';
import LiveSection from '@/components/match/LiveSection';

interface Props {
  params: { match: string };
}
export default async function ResultsMatch({ params }: Props) {
  const match = await supabase(cookies)
    .getMatch(parseInt(params.match))
    .then(verifySingleResult);

  const { data: adminRoles } = await supabase(cookies).getAdminRoles();

  return (
    <main className="main flex flex-col items-center text-center">
      <h1 className="mb-8 text-accent font-bold">{`Match ${match.id}`}</h1>
      <div className="flex gap-8 justify-around w-full">
        <MatchSection match={match} isMatchAdmin={Boolean(adminRoles?.match_admin)} />
        <ServerSection match={match} isMatchAdmin={Boolean(adminRoles?.match_admin)} />
        <LiveSection match={match} isMatchAdmin={Boolean(adminRoles?.match_admin)} />
      </div>
    </main>
  );
}
