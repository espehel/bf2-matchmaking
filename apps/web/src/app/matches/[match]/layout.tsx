import { ReactNode } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import { MatchProvider } from '@/state/MatchContext';

export default async function MatchLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: {
    match: string;
  };
}) {
  const matchId = Number(params.match);
  const [match, serverRes] = await Promise.all([
    supabase(cookies).getMatch(matchId).then(verifySingleResult),
    supabase(cookies).getMatchServers(matchId),
  ]);

  return (
    <MatchProvider match={match} servers={serverRes.data?.servers || []}>
      {children}
    </MatchProvider>
  );
}
