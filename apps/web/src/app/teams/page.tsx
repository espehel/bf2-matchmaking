import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/supabase';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { ActiveTeam } from '@bf2-matchmaking/types';
import TeamCreateForm from '@/components/TeamCreateForm';
import Link from 'next/link';
import { deactivateTeam } from '@/app/teams/[team]/actions';
import ActionWrapper from '@/components/commons/ActionWrapper';
import { isTeamOfficer } from '@bf2-matchmaking/utils';

interface Props {
  searchParams: { edit?: string };
}

export default async function TeamsPage({ searchParams }: Props) {
  const teams = await supabase(cookies).getActiveTeams().then(verifyResult);
  const { data: player } = await supabase(cookies).getSessionPlayer();
  const playerTeamIds = await supabase(cookies).getSessionPlayerTeamIds();
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();

  function _isTeamOfficer(team: ActiveTeam) {
    return player ? adminRoles?.player_admin || isTeamOfficer(team, player.id) : false;
  }

  const myTeams = teams
    .filter((t) => playerTeamIds.includes(t.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const otherTeams = teams
    .filter((t) => !playerTeamIds.includes(t.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const hasEditPermission = await supabase(cookies).isTeamPlayerOfficer(
    ...myTeams.map((t) => t.id)
  );
  const edit = hasEditPermission && searchParams.edit === 'true';

  return (
    <main className="main">
      <div className="flex gap-4">
        {myTeams.length > 0 && (
          <section className="section w-fit">
            <h2>My teams</h2>
            <TeamList
              teams={myTeams.filter((t) => (edit ? _isTeamOfficer(t) : true))}
              edit={edit}
            />
          </section>
        )}
        {player && (
          <div>
            <section className="section w-fit h-fit px-12">
              <h2 className="text-xl">Add new team</h2>
              <TeamCreateForm />
            </section>
            <div className="flex gap-2 mt-2">
              <Link className="btn btn-sm btn-secondary" href="/teams/inactive">
                Go to inactive
              </Link>
              {edit ? (
                <Link className="btn btn-sm btn-secondary" href={`/teams`}>
                  Exit edit
                </Link>
              ) : (
                <Link className="btn btn-sm btn-secondary" href={`/teams/?edit=true`}>
                  Edit teams
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      <section className="section w-fit mt-4">
        <h2>{myTeams.length > 0 ? 'Other teams' : 'Teams'}</h2>
        <TeamList
          teams={otherTeams.filter((t) => (edit ? _isTeamOfficer(t) : true))}
          edit={edit}
        />
      </section>
    </main>
  );
}

interface TeamListProps {
  teams: Array<ActiveTeam>;
  edit: boolean;
}
function TeamList({ teams, edit }: TeamListProps) {
  function deactivateTeamSA(teamId: number) {
    return async () => {
      'use server';
      return deactivateTeam(teamId);
    };
  }
  return (
    <ul className="flex flex-col gap-2">
      {teams.map((t) => (
        <li
          className="bg-secondary text-secondary-content border-accent border rounded max-w-3xl w-full flex"
          key={t.id}
        >
          <Link className="flex items-center gap-4 p-4 w-full" href={`/teams/${t.id}`}>
            <Avatar team={t} />
            <p className="text-3xl font-bold font-serif">{t.name}</p>
            <p className="text-lg font-bold ml-auto self-end">{`Players: ${t.players.length}`}</p>
            <p className="text-lg font-bold self-end">{`Owner: ${t.owner.nick}`}</p>
          </Link>
          {edit && (
            <ActionWrapper
              action={deactivateTeamSA(t.id)}
              successMessage="Team archived"
              errorMessage="Failed to archive team"
              className="btn btn-sm btn-accent m-2"
            >
              Archive
            </ActionWrapper>
          )}
        </li>
      ))}
    </ul>
  );
}

interface AvatarProps {
  team: ActiveTeam;
}

function Avatar({ team }: AvatarProps) {
  /*if (team.avatar) {
    return (
      <div className="avatar">
        <div className="w-12 rounded-full">
          <Image src={team.avatar} alt="avatar" />
        </div>
      </div>
    );
  }*/
  return (
    <div className="avatar placeholder">
      <div className="bg-primary text-primary-content rounded-full w-12">
        <span className="text-xl font-bold capitalize">{team.name.trim().charAt(0)}</span>
      </div>
    </div>
  );
}
