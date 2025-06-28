import { ReactNode } from 'react';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import { MatchProvider } from '@/state/MatchContext';

export default async function MatchLayout(props: {
  children: ReactNode;
  params: Promise<{
    match: string;
  }>;
}) {
  const params = await props.params;

  const { children } = props;

  const matchId = Number(params.match);
  const cookieStore = await cookies();
  const [match, serverRes] = await Promise.all([
    supabase(cookieStore).getMatch(matchId).then(verifySingleResult),
    supabase(cookieStore).getMatchServers(matchId),
  ]);

  return (
    <MatchProvider match={match} servers={serverRes.data?.servers || []}>
      {children}
    </MatchProvider>
  );
}
