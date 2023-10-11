import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import TeamDetailsSection from '@/components/teams/TeamDetailsSection';
import TeamDetailsForm from '@/components/teams/TeamDetailsForm';
import EditTeamPlayersSection from '@/components/teams/EditTeamPlayersSection';
import TeamPlayersSection from '@/components/teams/TeamPlayersSection';

interface Props {
  params: { team: string };
  searchParams: { edit?: string };
}
export default async function TeamPage({ params, searchParams }: Props) {
  const team = await supabase(cookies)
    .getTeam(Number(params.team))
    .then(verifySingleResult);

  const edit = searchParams.edit === 'true';

  return (
    <main className="main flex flex-col gap-6">
      <h1 className="font-serif font-extrabold text-5xl text-center">{`Team ${team.name}`}</h1>
      {edit ? <TeamDetailsForm team={team} /> : <TeamDetailsSection team={team} />}
      {edit ? <EditTeamPlayersSection team={team} /> : <TeamPlayersSection team={team} />}
    </main>
  );
}
