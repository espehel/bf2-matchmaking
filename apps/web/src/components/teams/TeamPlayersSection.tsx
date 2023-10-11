import { PlayersRow, TeamsJoined } from '@bf2-matchmaking/types';
import { StarIcon } from '@heroicons/react/20/solid';

interface Props {
  team: TeamsJoined;
}

export default function TeamPlayersSection({ team }: Props) {
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
          <li key={p.id} className="flex items-center w-52 text-lg">
            {p.full_name}
            {p.captain && <StarIcon height={16} viewBox="0 2 20 20" />}
          </li>
        ))}
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
