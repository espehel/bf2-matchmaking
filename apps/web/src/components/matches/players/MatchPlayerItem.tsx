import { PlayersRow, MatchplayersRow, TeamsRow } from '@bf2-matchmaking/schemas/types';
import { publicMatchRoleSchema } from '@bf2-matchmaking/schemas';
import {
  setMatchPlayerRole,
  setMatchPlayerTeam,
} from '@/app/matches/[match]/players/actions';
import SingleSelectActionForm from '@/components/form/SingleSelectActionForm';
import { MatchPlayerRatingFormAction } from '@/components/matches/players/MatchPlayerRatingAction';

interface Props {
  player: PlayersRow;
  matchPlayer: MatchplayersRow;
  teams: Array<TeamsRow>;
}

export function MatchPlayerItem({ player, matchPlayer, teams }: Props) {
  return (
    <li className="list-row">
      <SingleSelectActionForm
        name="role"
        label="Role"
        formAction={setMatchPlayerRole}
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
      <div className="flex items-center">{player.nick}</div>
      <MatchPlayerRatingFormAction
        key={matchPlayer.rating}
        matchPlayer={matchPlayer}
        ratings={[1300, 1400, 1500, 1600, 1700]}
      />
      <SingleSelectActionForm
        name="team"
        label="Team"
        formAction={setMatchPlayerTeam}
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
