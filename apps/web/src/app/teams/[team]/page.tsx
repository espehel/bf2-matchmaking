import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import TeamDetailsSection from '@/components/teams/TeamDetailsSection';
import TeamDetailsForm from '@/components/teams/TeamDetailsForm';
import EditTeamPlayersSection from '@/components/teams/EditTeamPlayersSection';
import TeamPlayersSection from '@/components/teams/TeamPlayersSection';
import { Suspense } from 'react';
import LoadingSection from '@/components/commons/LoadingSection';
import Link from 'next/link';
import { ChevronLeftIcon } from '@heroicons/react/16/solid';

interface Props {
  params: { team: string };
  searchParams: { edit?: string };
}
export default async function TeamPage({ params, searchParams }: Props) {
  const { data: player } = await supabase(cookies).getSessionPlayer();
  const team = await supabase(cookies)
    .getTeam(Number(params.team))
    .then(verifySingleResult);

  const isTeamOfficer = await supabase(cookies).isTeamPlayerOfficer(team.id);
  const isTeamPlayer = team.players.some((p) => p.id === player?.id);

  const edit = isTeamOfficer && searchParams.edit === 'true';

  return (
    <main className="main flex flex-col gap-6">
      <h1 className="font-serif font-extrabold text-5xl text-center text-accent">{`Team ${team.name}`}</h1>
      <Suspense fallback={<LoadingSection />}>
        {edit ? <TeamDetailsForm team={team} /> : <TeamDetailsSection team={team} />}
      </Suspense>
      {isTeamOfficer && (
        <div className="flex gap-4">
          {edit ? (
            <Link className="btn btn-secondary" href={`/teams/${team.id}`}>
              <ChevronLeftIcon className="size-8" />
              Back
            </Link>
          ) : (
            <Link className="btn btn-secondary" href={`/teams/${team.id}/?edit=true`}>
              Add players
            </Link>
          )}
          {isTeamPlayer && (
            <Link className="btn btn-secondary" href={`/challenges/${team.id}`}>
              Go to challenges
            </Link>
          )}
        </div>
      )}
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
