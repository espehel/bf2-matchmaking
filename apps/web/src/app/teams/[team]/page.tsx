import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import TeamDetailsSection from '@/components/teams/TeamDetailsSection';
import TeamDetailsForm from '@/components/teams/TeamDetailsForm';
import EditTeamPlayersSection from '@/components/teams/EditTeamPlayersSection';
import TeamPlayersSection from '@/components/teams/TeamPlayersSection';
import { Suspense } from 'react';
import LoadingSection from '@/components/commons/LoadingSection';

interface Props {
  params: { team: string };
  searchParams: { edit?: string };
}
export default async function TeamPage({ params, searchParams }: Props) {
  const team = await supabase(cookies)
    .getTeam(Number(params.team))
    .then(verifySingleResult);

  const isTeamOfficer = await supabase(cookies).isTeamOfficer(team.id);

  const edit = isTeamOfficer && searchParams.edit === 'true';

  return (
    <main className="main flex flex-col gap-6">
      <h1 className="font-serif font-extrabold text-5xl text-center text-accent">{`Team ${team.name}`}</h1>
      <Suspense fallback={<LoadingSection />}>
        {edit ? <TeamDetailsForm team={team} /> : <TeamDetailsSection team={team} />}
      </Suspense>
      <Suspense fallback={<LoadingSection />}>
        {edit ? (
          <EditTeamPlayersSection team={team} />
        ) : (
          <TeamPlayersSection team={team} />
        )}
      </Suspense>
    </main>
  );
}
