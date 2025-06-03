import { MatchConfigsRow, TeamsJoined } from '@bf2-matchmaking/types';
import { addChallengeTeam } from '@/app/challenges/actions';
import SelectActionForm from '@/components/SelectActionForm';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  selectedTeam: TeamsJoined;
}

export default async function AddChallengeTeamForm({ selectedTeam }: Props) {
  const cookieStore = await cookies();
  const { data: ladderConfigs } = await supabase(cookieStore).getMatchConfigsWithType(
    'Ladder'
  );
  if (!ladderConfigs) {
    return null;
  }

  const options = ladderConfigs
    .filter(isAlreadyAdded(selectedTeam))
    .map<[number, string]>(({ id, name }) => [id, name]);

  if (options.length === 0) {
    return null;
  }

  return (
    <SelectActionForm
      label="Sign up"
      name="configId"
      options={options}
      action={addChallengeTeam}
      extras={{ teamId: selectedTeam.id.toString() }}
      successMessage="Team added to challenge"
      errorMessage="Failed to add team to challange"
      className="w-full"
    />
  );
}

function isAlreadyAdded(team: TeamsJoined) {
  return (config: MatchConfigsRow) =>
    !team.challenges.some((challenge) => challenge.config === config.id);
}
