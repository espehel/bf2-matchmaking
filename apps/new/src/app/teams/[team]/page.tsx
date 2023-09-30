import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import { TeamsJoined } from '@bf2-matchmaking/types';
import { PencilSquareIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

interface Props {
  params: { team: string };
}
export default async function TeamPage({ params }: Props) {
  const team = await supabase(cookies)
    .getTeam(Number(params.team))
    .then(verifySingleResult);

  return (
    <main className="main flex flex-col gap-6">
      <h1>Team details</h1>
      <section className="section">
        <h2>Info:</h2>
        <PencilSquareIcon />
        <Avatar team={team} />
        <div>
          <span>Name:</span>
          <span>{team.name}</span>
        </div>
        <div>
          <span>Owner:</span>
          <span>{team.owner.full_name}</span>
        </div>
      </section>
      <section className="section">
        <h2>Players:</h2>
        <ul>
          {team.players.map((p) => (
            <li key={p.player_id}>{p.player_id}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

interface AvatarProps {
  team: TeamsJoined;
}
function Avatar({ team }: AvatarProps) {
  if (team.avatar) {
    return (
      <div className="avatar">
        <div className="w-24 rounded-full">
          <Image src={team.avatar} alt="avatar" />
        </div>
      </div>
    );
  } else {
    return (
      <div className="avatar placeholder">
        <div className="bg-neutral-focus text-neutral-content rounded-full w-24">
          <span className="text-3xl">{team.name.charAt(0)}</span>
        </div>
      </div>
    );
  }
}
