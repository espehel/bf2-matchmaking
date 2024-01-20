import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import InstanceSection from '@/components/matches-server/InstanceSection';
import SetServerSection from '@/components/matches-server/SetServerSection';

interface Props {
  params: { match: string };
}
export default async function ResultsMatch({ params }: Props) {
  const match = await supabase(cookies)
    .getMatch(Number(params.match))
    .then(verifySingleResult);
  const { data: matchServer } = await supabase(cookies).getMatchServer(
    Number(params.match)
  );
  return (
    <main className="main">
      <h1>{`Manage match ${match.id} servers`}</h1>
      <InstanceSection matchId={match.id} matchServer={matchServer} />
      <SetServerSection match={match} matchServer={matchServer} />
    </main>
  );
}
