import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import RoundsList from '@/components/RoundsList';
import { MatchResult, PlayersRow } from '@bf2-matchmaking/types';
import TeamResultTable from '@/components/TeamResultTable';
import {
  calculateMatchResults,
  getTeamTickets,
} from '@bf2-matchmaking/utils/src/results-utils';
import TeamStats from '@/components/TeamStats';

const compareScore = (
  [, playerA]: PlayerMatchResultTuple,
  [, playerB]: PlayerMatchResultTuple
) =>
  (playerB ? playerB.score : Number.MIN_VALUE) -
  (playerA ? playerA.score : Number.MIN_VALUE);

type PlayerMatchResultTuple = [PlayersRow, MatchResult | null];
interface Props {
  params: { match: string };
}
export default async function ResultsMatch({ params }: Props) {
  const match = await supabase(cookies)
    .getMatch(parseInt(params.match))
    .then(verifySingleResult);

  const matchResults: Array<PlayerMatchResultTuple> = calculateMatchResults(match);
  const isTeam =
    (team: string) =>
    ([player]: PlayerMatchResultTuple) =>
      match.teams.find(({ player_id }) => player_id === player.id)?.team === team;

  const teamATickets = getTeamTickets(match, 'a');
  const teamBTickets = getTeamTickets(match, 'b');

  return (
    <main className="main text-center">
      <h1 className="mb-8 text-accent font-bold">{`Match ${match.id}`}</h1>
      <div className="flex flex-col justify-around">
        <div className="flex mt-2 gap-4">
          <TeamStats team="a" match={match} isWinner={teamATickets > teamBTickets} />
          <TeamResultTable
            playerResults={matchResults.filter(isTeam('a')).sort(compareScore)}
            match={match}
          />
        </div>
        <div className="divider">vs</div>
        <div className="flex mt-2 gap-4">
          <TeamStats team="b" match={match} isWinner={teamBTickets > teamATickets} />
          <TeamResultTable
            playerResults={matchResults.filter(isTeam('b')).sort(compareScore)}
            match={match}
          />
        </div>
      </div>
      <div className="divider" />
      <RoundsList
        rounds={[...match.rounds].sort((a, b) =>
          a.created_at.localeCompare(b.created_at)
        )}
      />
    </main>
  );
}
