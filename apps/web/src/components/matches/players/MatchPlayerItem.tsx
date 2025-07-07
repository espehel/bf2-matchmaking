import { PlayersRow, MatchplayersRow, TeamsRow } from '@bf2-matchmaking/schemas/types';
import { publicMatchRoleSchema } from '@bf2-matchmaking/schemas';
import SingleInputActionForm from '@/components/form/SingleInputActionForm';
import {
  setMatchPlayerRole,
  setMatchPlayerTeam,
  setPlayerRating,
} from '@/app/matches/[match]/players/actions';
import SingleSelectActionForm from '@/components/form/SingleSelectActionForm';

interface Props {
  player: PlayersRow;
  matchPlayer: MatchplayersRow;
  teams: Array<TeamsRow>;
}

export function MatchPlayerItem({ player, matchPlayer, teams }: Props) {
  return (
    <li className="list-row">
      <div className="flex items-center justify-center rounded-box bg-accent size-8">
        {matchPlayer.role || 'None'}
      </div>
      <div className="flex items-center">{player.nick}</div>
      <SingleSelectActionForm
        name="role"
        label="Role"
        action={setMatchPlayerRole}
        successMessage="Role updated"
        errorMessage="Failed to update role"
        extras={{
          matchId: matchPlayer.match_id.toString(),
          playerId: matchPlayer.player_id,
        }}
        placeholder="None"
        defaultValue={matchPlayer.role}
        options={publicMatchRoleSchema.options.map((o) => o.value)}
        size="sm"
        className="w-20"
      />
      <SingleInputActionForm
        name="rating"
        defaultValue={matchPlayer.rating}
        action={setPlayerRating}
        extras={{
          matchId: matchPlayer.match_id.toString(),
          playerId: matchPlayer.player_id,
        }}
        resetOnSuccess={false}
        successMessage="Rating updated"
        errorMessage="Failed to update rating"
        kind="accent"
        size="sm"
        className="w-32"
        type="number"
        placeholder="Rating"
      />
      <SingleSelectActionForm
        name="team"
        label="Team"
        action={setMatchPlayerTeam}
        successMessage="Team updated"
        errorMessage="Failed to update team"
        extras={{
          matchId: matchPlayer.match_id.toString(),
          playerId: matchPlayer.player_id,
        }}
        defaultValue={matchPlayer.team ?? undefined}
        options={[
          [undefined, 'None'],
          ...teams.map<[number, string]>(({ id, name }) => [id, `Team ${name}`]),
        ]}
        size="sm"
        className="w-24"
      />
    </li>
  );
}
