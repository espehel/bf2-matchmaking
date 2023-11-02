import { MatchesJoined, MatchPlayerResultsRow } from '@bf2-matchmaking/types';
import TeamStats from '@/components/TeamStats';
import TeamResultTable from '@/components/TeamResultTable';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { toTuple } from '@bf2-matchmaking/utils';

interface Props {
  match: MatchesJoined;
}

export default async function MatchResultSection({ match }: Props) {
  const matchResult = await supabase(cookies)
    .getMatchResultsByMatchId(match.id)
    .then(verifyResult)
    .then(toTuple);

  if (!matchResult) {
    return <p>Match closed without results</p>;
  }

  const playerResults = await supabase(cookies)
    .getMatchPlayerResultsByMatchId(match.id)
    .then(verifyResult);

  const [team1Result, team2Result] = matchResult;

  return (
    <div className="flex flex-col xl:flex-row justify-around w-full">
      <div className="flex flex-col mt-2 gap-4">
        <TeamStats matchResult={team1Result} />
        <TeamResultTable
          playerResults={playerResults.filter(isTeam(team1Result.team.id))}
          match={match}
        />
      </div>
      <div className="divider xl:divider-horizontal">vs</div>
      <div className="flex flex-col mt-2 gap-4">
        <TeamStats matchResult={team2Result} />
        <TeamResultTable
          playerResults={playerResults.filter(isTeam(team2Result.team.id))}
          match={match}
        />
      </div>
    </div>
  );
}

const isTeam = (team: number) => (playerResult: MatchPlayerResultsRow) =>
  playerResult.team === team;
