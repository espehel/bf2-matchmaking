import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { TeamsJoined } from '@bf2-matchmaking/types';
import TeamCreateForm from '@/components/TeamCreateForm';
import Link from 'next/link';

export default async function TeamsPage() {
  const teams = await supabase(cookies).getVisibleTeams().then(verifyResult);
  return (
    <main className="main">
      <ul className="flex flex-col gap-2 justify-center items-center">
        {teams.map((t) => (
          <li className="sheet max-w-3xl w-full" key={t.id}>
            <Link className="flex items-center gap-4" href={`/teams/${t.id}`}>
              <Avatar team={t} />
              <p className="text-3xl font-bold font-serif">{t.name}</p>
              <p className="text-lg font-bold ml-auto self-end">{`Players: ${t.players.length}`}</p>
              <p className="text-lg font-bold self-end">{`Owner: ${t.owner.full_name}`}</p>
            </Link>
          </li>
        ))}
      </ul>
      <section className="section max-w-3xl w-full m-auto mt-6">
        <h2 className="text-xl">Add new team</h2>
        <TeamCreateForm />
      </section>
    </main>
  );
}

interface AvatarProps {
  team: TeamsJoined;
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
      <div className="bg-neutral-focus text-neutral-content rounded-full w-12">
        <span className="text-xl">{team.name.charAt(0)}</span>
      </div>
    </div>
  );
}
