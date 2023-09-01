import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import RoundsList from '@/components/RoundsList';
import { MatchPlayerResultsRow } from '@bf2-matchmaking/types';
import TeamResultTable from '@/components/TeamResultTable';
import TeamStats from '@/components/TeamStats';
import { assertObj, toTuple } from '@bf2-matchmaking/utils';

const isTeam = (team: number) => (playerResult: MatchPlayerResultsRow) =>
  playerResult.team === team;
interface Props {
  params: { match: string };
}
export default async function ResultsMatch({ params }: Props) {
  const match = await supabase(cookies)
    .getMatch(Number(params.match))
    .then(verifySingleResult);
  const matchResult = await supabase(cookies)
    .getMatchResultsByMatchId(Number(params.match))
    .then(verifyResult)
    .then(toTuple);
  assertObj(matchResult);
  const playerResults = await supabase(cookies)
    .getPlayerMatchResultsByMatchId(Number(params.match))
    .then(verifyResult);

  const [team1Result, team2Result] = matchResult;

  return (
    <main className="main text-center">
      <h1 className="mb-8 text-accent font-bold">{`Match ${match.id}`}</h1>
      <div className="flex flex-col xl:flex-row justify-around w-full">
        <div className="flex flex-col mt-2 gap-4">
          <TeamStats matchResult={team1Result} />
          <TeamResultTable
            playerResults={playerResults.filter(isTeam(team1Result.team))}
            match={match}
          />
        </div>
        <div className="divider xl:divider-horizontal">vs</div>
        <div className="flex flex-col mt-2 gap-4">
          <TeamStats matchResult={team2Result} />
          <TeamResultTable
            playerResults={playerResults.filter(isTeam(team2Result.team))}
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
