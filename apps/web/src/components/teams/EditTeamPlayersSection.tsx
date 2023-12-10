import { PlayersRow, TeamsJoined } from '@bf2-matchmaking/types';
import AddPlayerForm from '@/components/teams/AddPlayerForm';
import TeamPlayerItem from '@/components/teams/TeamPlayerItem';

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

  return (
    <section className="section gap-2">
      <h2 className="text-xl">Players:</h2>
      <ul className="ml-2">
        {players.map((p) => (
          <TeamPlayerItem key={p.id} player={p} team={team} />
        ))}
        <li className="flex items-center w-52">
          <AddPlayerForm teamId={team.id} />
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
  return a.nick.localeCompare(b.nick);
}
