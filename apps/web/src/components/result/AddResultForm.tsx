import { MatchesJoined } from '@bf2-matchmaking/types';
import FormSubmitButton from '@/components/FormSubmitButton';
import { addResult } from '@/app/results/[match]/actions';
import ActionForm from '@/components/form/ActionForm';

interface Props {
  match: MatchesJoined;
}

export default function AddResultForm({ match }: Props) {
  async function addResultSA(data: FormData) {
    'use server';
    return addResult(match, data);
  }
  return (
    <ActionForm
      action={addResultSA}
      successMessage="Result added"
      errorMessage="Failed to add result"
    >
      <div className="grid grid-cols-[min-content_min-content_min-content_min-content] gap-2 items-center mb-2">
        <p>Team</p>
        <p>Rounds</p>
        <p>Maps</p>
        <p>Total tickets</p>
        <p>{match.home_team.name}</p>
        <input className="input  ed" name="homeRoundInput" />
        <input className="input  ed" name="homeMapsInput" />
        <input className="input  ed" name="homeTicketsInput" />
        <p>{match.away_team.name}</p>
        <input className="input  ed" name="awayRoundInput" />
        <input className="input  ed" name="awayMapsInput" />
        <input className="input  ed" name="awayTicketsInput" />
      </div>
      <FormSubmitButton>Add result</FormSubmitButton>
    </ActionForm>
  );
}
