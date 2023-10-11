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
  const match = await supabase(cookies)
    .getMatch(parseInt(params.match))
    .then(verifySingleResult);

  return <MatchProvider match={match}>{children}</MatchProvider>;
}
