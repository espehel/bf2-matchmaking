import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/supabase';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { InactiveTeam } from '@bf2-matchmaking/types';
import ActionWrapper from '@/components/commons/ActionWrapper';
import { activateTeam } from '@/app/teams/[team]/actions';

export default async function TeamsPage() {
  const teams = await supabase(cookies).getInactiveTeams().then(verifyResult);
  const { data: player } = await supabase(cookies).getSessionPlayer();
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();

  const myTeams = player
    ? teams
        .filter((t) => t.owner.id === player.id)
        .sort((a, b) => a.name.localeCompare(b.name))
    : [];
  const otherTeams = adminRoles?.player_admin
    ? [...teams].sort((a, b) => a.name.localeCompare(b.name))
    : [];

  if (myTeams.length === 0 && otherTeams.length === 0) {
    return (
      <main className="main">
        <h1>No visible teams</h1>
        <p>
          You need to be either captain of a team or player admin to see inactive teams.
        </p>
      </main>
    );
  }

  return (
    <main className="main">
      <div className="w-fit">
        {myTeams.length > 0 && (
          <section className="section">
            <h2>My teams</h2>
            <TeamList teams={myTeams} />
          </section>
        )}
        {otherTeams.length > 0 && (
          <section className="section w-fit mt-4">
            <h2>All teams</h2>
            <TeamList teams={otherTeams} />
          </section>
        )}
      </div>
    </main>
  );
}

interface TeamListProps {
  teams: Array<InactiveTeam>;
}
function TeamList({ teams }: TeamListProps) {
  function activateTeamSA(teamId: number) {
    return async () => {
      'use server';
      return activateTeam(teamId);
    };
  }
  return (
    <ul className="flex flex-col gap-2">
      {teams.map((t) => (
        <li
          className="bg-base-200 p-4 border-accent border rounded max-w-3xl w-full"
          key={t.id}
        >
          <div className="flex items-center gap-4">
            <Avatar team={t} />
            <p className="text-3xl font-bold font-serif text-accent">{t.name}</p>
            <p className="text-lg font-bold self-end ml-auto">{`Owner: ${t.owner.nick}`}</p>
            <ActionWrapper
              action={activateTeamSA(t.id)}
              successMessage="Team activated"
              errorMessage="Failed to activate team"
              className="btn btn-sm btn-secondary self-end"
            >
              Activate
            </ActionWrapper>
          </div>
        </li>
      ))}
    </ul>
  );
}

interface AvatarProps {
  team: InactiveTeam;
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
