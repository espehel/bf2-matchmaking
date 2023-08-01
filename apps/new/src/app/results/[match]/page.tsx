import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import RoundsList from '@/components/RoundsList';
import {
  MatchPlayersRow,
  MatchResult,
  PlayerListItem,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { calculateMatchResults } from '@bf2-matchmaking/utils';
import TeamResultTable from '@/components/TeamResultTable';

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

  const teamATickets = match.rounds
    .map((round, i) => (i % 2 === 0 ? round.team1_tickets : round.team2_tickets))
    .reduce((acc, cur) => acc + parseInt(cur), 0);

  const teamBTickets = match.rounds
    .map((round, i) => (i % 2 === 1 ? round.team1_tickets : round.team2_tickets))
    .reduce((acc, cur) => acc + parseInt(cur), 0);

  const winner =
    teamATickets === teamBTickets
      ? 'Draw'
      : teamATickets > teamBTickets
      ? 'Team A wins'
      : 'Team B wins';

  console.log(matchResults);

  return (
    <main className="main w-3/4 m-auto text-center">
      <h1 className="mb-8 text-accent font-bold">{`Match ${match.id} - ${winner}`}</h1>
      <div className="flex flex-col justify-around">
        <TeamResultTable
          playerResults={matchResults.filter(isTeam('a')).sort(compareScore)}
        />
        <div className="divider">vs</div>
        <TeamResultTable
          playerResults={matchResults.filter(isTeam('b')).sort(compareScore)}
        />
      </div>
      <div className="divider" />
      <RoundsList rounds={match.rounds} />
    </main>
  );
}
