import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/supabase';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { TeamsJoined, VisibleTeam } from '@bf2-matchmaking/types';
import TeamCreateForm from '@/components/TeamCreateForm';
import Link from 'next/link';

export default async function TeamsPage() {
  const teams = await supabase(cookies).getVisibleTeams().then(verifyResult);
  const { data: player } = await supabase(cookies).getSessionPlayer();

  const sortedTeams = [...teams].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="main">
      <h1>Teams</h1>
      <div className="flex gap-4">
        <ul className="flex flex-col gap-2">
          {sortedTeams.map((t) => (
            <li className="sheet max-w-3xl w-full" key={t.id}>
              <Link className="flex items-center gap-4" href={`/teams/${t.id}`}>
                <Avatar team={t} />
                <p className="text-3xl font-bold font-serif text-accent">{t.name}</p>
                <p className="text-lg font-bold ml-auto self-end">{`Players: ${t.players.length}`}</p>
                <p className="text-lg font-bold self-end">{`Owner: ${t.owner.nick}`}</p>
              </Link>
            </li>
          ))}
        </ul>
        {player && (
          <section className="section w-fit h-fit px-12">
            <h2 className="text-xl">Add new team</h2>
            <TeamCreateForm />
          </section>
        )}
      </div>
    </main>
  );
}

interface AvatarProps {
  team: VisibleTeam;
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
