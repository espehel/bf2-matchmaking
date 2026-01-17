import { MatchesJoined, MatchTeam } from '@bf2-matchmaking/types';
import AddPlayerForm from '@/components/matches/AddPlayerForm';
import PlayerListItems from '@/components/matches/team/PlayerListItems';
import { Suspense } from 'react';
import PlayerListItemsLoading from '@/components/matches/team/PlayerListItemsLoading';
import { isTeam } from '@bf2-matchmaking/utils';
import TeamPlayersList from '@/components/matches/team/TeamPlayersList';
import UnfilledRolesListitems from './UnfilledRolesListitems';

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

  return (
    <section>
      <h3 className="text-xl font-bold mb-2">{`Team ${team.name}`}</h3>
      {match.config.type !== 'Mix' && <div className="divider">Roster</div>}
      {players.length === 0 && (
        <p className="text-xs opacity-60 max-w-52 mb-2">
          No players in roster yet. Team Players can be added manually below, or
          automatically when joining server.
        </p>
      )}
      <ul>
        <Suspense
          fallback={
            <PlayerListItemsLoading
              match={match}
              team={team.id}
              captains={captains}
              players={players}
            />
          }
        >
          <PlayerListItems
            match={match}
            team={team.id}
            players={players}
            captains={captains}
          />
        </Suspense>
        <UnfilledRolesListitems team={team} match={match} />
        <li className="flex items-center mb-1 w-52">
          <AddPlayerForm
            matchId={match.id}
            teamId={team.id}
            config={match.config.id}
            label="Add step-in"
          />
        </li>
      </ul>
      <TeamPlayersList match={match} team={team} />
    </section>
  );
}
