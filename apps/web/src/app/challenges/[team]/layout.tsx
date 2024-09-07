import { ReactNode, Suspense } from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import AuthButton from '@/components/AuthButton';
import ChallengesMenu from '@/components/challenges/ChallengesMenu';
import { verifySingleResult } from '@bf2-matchmaking/supabase';

interface Props {
  children: ReactNode;
  params: { team: string };
}

export default async function ChallengesTeamLayout({ children, params }: Props) {
  const selectedTeam = await supabase(cookies)
    .getTeam(Number(params.team))
    .then(verifySingleResult);
  const { data: player } = await supabase(cookies).getSessionPlayer();
  return (
    <div className="flex">
      {player && (
        <aside className="bg-base-100 min-h-main border-r border-primary p-4 w-64">
          <Suspense fallback={null}>
            <ChallengesMenu player={player} selectedTeam={selectedTeam} />
          </Suspense>
        </aside>
      )}
      <main className="main">
        <h1 className="mb-6">Challenges</h1>
        {player && children}
        {!player && (
          <section className="section w-fit">
            <h2>You are not logged in</h2>
            <AuthButton className="btn btn-accent w-20" session={null} />
          </section>
        )}
      </main>
    </div>
  );
}
