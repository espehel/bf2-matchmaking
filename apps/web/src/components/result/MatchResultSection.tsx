import { MatchesJoined, MatchPlayerResultsRow } from '@bf2-matchmaking/types';
import TeamStats from '@/components/TeamStats';
import TeamResultTable from '@/components/TeamResultTable';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { toTuple } from '@bf2-matchmaking/utils';
import ActionButton from '@/components/ActionButton';
import { reopenMatch } from '@/app/results/[match]/actions';

interface Props {
  match: MatchesJoined;
}

export default async function MatchResultSection({ match }: Props) {
  const cookieStore = await cookies();
  const matchResult = await supabase(cookieStore)
    .getMatchResultsByMatchId(match.id)
    .then(verifyResult)
    .then(toTuple);

  async function reopenMatchSA() {
    'use server';
    return reopenMatch(match.id);
  }

  if (!matchResult) {
    return (
      <section className="section text-left">
        <h2 className="text-xl">Match closed without results</h2>
        <ActionButton
          formAction={reopenMatchSA}
          kind="btn-primary"
          successMessage="Match reopened"
          errorMessage="Failed to reopen match"
        >
          Reopen match
        </ActionButton>
      </section>
    );
  }

  const playerResults = await supabase(cookieStore)
    .getMatchPlayerResultsByMatchId(match.id)
    .then(verifyResult);

  const [team1Result, team2Result] = matchResult;

  return (
    <section className="section">
      <div className="flex flex-col xl:flex-row justify-around items-center xl:items-start w-full">
        <div className="flex flex-col mt-2 gap-4 w-5/12">
          <TeamStats matchResult={team1Result} />
          <TeamResultTable
            playerResults={playerResults.filter(isTeam(team1Result.team.id))}
            match={match}
          />
        </div>
        <div className="divider xl:divider-horizontal">vs</div>
        <div className="flex flex-col mt-2 gap-4 w-5/12">
          <TeamStats matchResult={team2Result} />
          <TeamResultTable
            playerResults={playerResults.filter(isTeam(team2Result.team.id))}
            match={match}
          />
        </div>
      </div>
    </section>
  );
}

const isTeam = (team: number) => (playerResult: MatchPlayerResultsRow) =>
  playerResult.team === team;
