import { supabase } from '@/lib/supabase/supabase-server';
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
import MainOld from '@/components/commons/MainOld';

interface Props {
  params: Promise<{ team: string }>;
  searchParams: Promise<{ edit?: string }>;
}
export default async function TeamPage(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();
  const team = await supabase(cookieStore)
    .getTeam(Number(params.team))
    .then(verifySingleResult);

  const isTeamOfficer = await supabase(cookieStore).isTeamPlayerOfficer(team.id);
  const isTeamPlayer = team.players.some((p) => p.id === player?.id);

  const edit = isTeamOfficer && searchParams.edit === 'true';

  return (
    <MainOld
      title={`Team ${team.name}`}
      relevantRoles={['player_admin']}
      breadcrumbs={[{ label: 'Teams', href: '/teams' }, { label: team.name }]}
    >
      <div className="flex flex-col gap-6">
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
      </div>
    </MainOld>
  );
}
