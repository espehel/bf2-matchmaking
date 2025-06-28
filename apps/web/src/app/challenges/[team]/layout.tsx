import { ReactNode, Suspense } from 'react';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import AuthButton from '@/components/AuthButton';
import ChallengesMenu from '@/components/challenges/ChallengesMenu';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  params: Promise<{ team: string }>;
}

export default async function ChallengesTeamLayout(props: Props) {
  const params = await props.params;

  const { children } = props;

  const cookieStore = await cookies();
  const selectedTeam = await supabase(cookieStore)
    .getTeam(Number(params.team))
    .then(verifySingleResult);
  const { data: player } = await supabase(cookieStore).getSessionPlayer();
  const isNotPlayerTeam = player
    ? !selectedTeam.players.some((p) => p.id === player.id)
    : false;
  return (
    <div className="flex">
      {!isNotPlayerTeam && player && (
        <aside className="bg-base-100 min-h-main border-r border-primary p-4 w-64">
          <Suspense fallback={null}>
            <ChallengesMenu player={player} selectedTeam={selectedTeam} />
          </Suspense>
        </aside>
      )}
      <main className="main">
        <h1 className="mb-6">{selectedTeam.name} Challenges</h1>
        {!isNotPlayerTeam && player && children}
        {!player && (
          <section className="section w-fit">
            <h2>You are not logged in</h2>
            <AuthButton className="btn btn-accent w-20" user={null} />
          </section>
        )}
        {isNotPlayerTeam && (
          <section className="section w-fit">
            <h2>You are not a member of this team</h2>
            <Link className="link link-accent" href={`/teams/${selectedTeam.id}`}>
              Go to {selectedTeam.name}
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
