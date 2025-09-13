import { PlayersRow, TeamsJoined } from '@bf2-matchmaking/types';
import AddPlayerForm from '@/components/teams/AddPlayerForm';
import TeamPlayerItem from '@/components/teams/TeamPlayerItem';
import ActionForm from '@/components/form/ActionForm';
import { createAndAddPlayer } from '@/app/teams/[team]/actions';
import FormSubmitButton from '@/components/FormSubmitButton';

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

  async function createAndAddPlayerSA(data: FormData) {
    'use server';
    return createAndAddPlayer(team.id, data);
  }

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
      <ActionForm
        formAction={createAndAddPlayerSA}
        successMessage="Player added"
        errorMessage="Failed to add player"
      >
        <input className="input mr-2" name="playerId" />
        <FormSubmitButton>Add</FormSubmitButton>
      </ActionForm>
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
