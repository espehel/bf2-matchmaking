import {
  MatchesJoined,
  MatchPlayersRow,
  PlayerListItem,
  TeamsRow,
} from '@bf2-matchmaking/types';
import PlayerItem from '@/components/match/PlayerItem';
import AddPlayerForm from '@/components/match/AddPlayerForm';

interface Props {
  match: MatchesJoined;
  team: TeamsRow;
  playerInfo: Array<PlayerListItem>;
}

export default function TeamSection({ match, team, playerInfo }: Props) {
  const players = match.teams
    .filter(isTeam(team.id))
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  const emptySlots = Array.from({ length: match.config.size / 2 - players.length });
  return (
    <section>
      <h3 className="text-xl font-bold mb-2">{`Team ${team.name}`}</h3>
      <ul>
        {players.map((mp) => (
          <PlayerItem
            key={mp.player_id}
            match={match}
            playerList={playerInfo}
            mp={mp}
            team={match.home_team.id}
          />
        ))}
        {emptySlots.map((e, i) => (
          <li key={i} className=" flex items-center w-52">
            <AddPlayerForm matchId={match.id} teamId={team.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}

const isTeam = (team: number) => (mp: MatchPlayersRow) => mp.team === team;
