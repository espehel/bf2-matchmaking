import { MatchesJoined, MatchPlayersRow, MatchTeam } from '@bf2-matchmaking/types';
import PlayerItem from '@/components/match/PlayerItem';
import AddPlayerForm from '@/components/match/AddPlayerForm';
import AddTeamPlayerCollapsible from '@/components/AddTeamPlayerCollapsible';

interface Props {
  match: MatchesJoined;
  team: MatchTeam;
}

export default async function TeamSection({ match, team }: Props) {
  const players = match.teams
    .filter(isTeam(team.id))
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at));

  const captains = team.players
    .filter((tp) => tp.captain)
    .map((tp) => tp.player_id)
    .concat(match.teams.filter((mp) => mp.captain).map((mp) => mp.player_id));

  const emptySlots = Array.from({ length: match.config.size / 2 - players.length });
  return (
    <section>
      <h3 className="text-xl font-bold mb-2">{`Team ${team.name}`}</h3>
      <ul>
        {players.map((mp) => (
          <PlayerItem
            key={mp.player_id}
            match={match}
            mp={mp}
            team={team.id}
            captains={captains}
          />
        ))}
        {emptySlots.map((e, i, { length }) => (
          <li key={(i + length) * length} className="flex items-center mb-1 w-52">
            <AddPlayerForm matchId={match.id} teamId={team.id} />
          </li>
        ))}
      </ul>
      {<AddTeamPlayerCollapsible match={match} team={team} />}
    </section>
  );
}

const isTeam = (team: number) => (mp: MatchPlayersRow) => mp.team === team;
