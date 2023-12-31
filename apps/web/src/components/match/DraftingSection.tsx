import { MatchesJoined, MatchTeam } from '@bf2-matchmaking/types';
import AddPlayerForm from '@/components/match/AddPlayerForm';
import AddTeamPlayerCollapsible from '@/components/AddTeamPlayerCollapsible';
import PlayerListItems from '@/components/match/PlayerListItems';
import { Suspense } from 'react';
import PlayerListItemsLoading from '@/components/match/PlayerListItemsLoading';
import { isTeam } from '@bf2-matchmaking/utils/src/team-utils';

interface Props {
  match: MatchesJoined;
}

export default async function DraftingSection({ match }: Props) {
  const players = match.teams.sort((a, b) => a.updated_at.localeCompare(b.updated_at));

  const captains = players.filter((mp) => mp.captain).map((mp) => mp.player_id);

  const emptySlots = Array.from({ length: match.config.size / 2 - players.length });
  return (
    <section>
      <h3 className="text-xl font-bold mb-2">Players</h3>
      <ul>
        <Suspense
          fallback={
            <PlayerListItemsLoading match={match} captains={captains} players={players} />
          }
        >
          <PlayerListItems match={match} players={players} captains={captains} />
        </Suspense>
        {emptySlots.map((e, i, { length }) => (
          <li key={(i + length) * length} className="flex items-center mb-1 w-52">
            <AddPlayerForm matchId={match.id} config={match.config.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}
