import { MatchesJoined, MatchTeam } from '@bf2-matchmaking/types';
import AddPlayerForm from '@/components/matches/AddPlayerForm';
import PlayerListItems from '@/components/matches/PlayerListItems';
import { Suspense } from 'react';
import PlayerListItemsLoading from '@/components/matches/PlayerListItemsLoading';
import { isTeam } from '@bf2-matchmaking/utils/src/team-utils';
import TeamPlayersList from '@/components/matches/TeamPlayersList';

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
        <li className="flex items-center mb-1 w-52">
          <AddPlayerForm
            matchId={match.id}
            teamId={team.id}
            config={match.config.id}
            label="Add step-in"
          />
        </li>
      </ul>
      {<TeamPlayersList match={match} team={team} />}
    </section>
  );
}
