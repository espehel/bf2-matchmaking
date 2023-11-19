import { PlayersRow, TeamsJoined } from '@bf2-matchmaking/types';
import { StarIcon } from '@heroicons/react/20/solid';
import AddPlayerForm from '@/components/teams/AddPlayerForm';
import TeamPlayerItem from '@/components/teams/TeamPlayerItem';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  team: TeamsJoined;
}

export default function EditTeamPlayersSection({ team }: Props) {
  const players = team.players
    .map((p) => ({
      ...p,
      captain: team.captains.some((c) => c.player_id === p.id),
    }))
    .sort(compareTeamPlayers);
  const isTeamOfficer = supabase(cookies).isTeamPlayerOfficer(team.id);

  return (
    <section className="section gap-2">
      <h2 className="text-xl">Players:</h2>
      <ul className="ml-2">
        {players.map((p) => (
          <TeamPlayerItem key={p.id} player={p} team={team} />
        ))}
        <li className="flex items-center w-52">
          <AddPlayerForm teamId={team.id} disabled={!isTeamOfficer} />
        </li>
      </ul>
    </section>
  );
}

function compareTeamPlayers(
  a: PlayersRow & { captain: boolean },
  b: PlayersRow & { captain: boolean }
) {
  if (a.captain !== b.captain) {
    return a.captain ? -1 : 1;
  }
  return a.full_name.localeCompare(b.full_name);
}
