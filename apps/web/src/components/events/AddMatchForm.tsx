import ActionForm from '@/components/commons/ActionForm';
import { addRoundMatch } from '@/app/events/[event]/actions';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import TeamCombobox from '@/components/TeamCombobox';
import TransitionWrapper from '@/components/commons/TransitionWrapper';
import IconBtn from '@/components/commons/IconBtn';
import { EventRoundsRow, EventsJoined } from '@bf2-matchmaking/types';
import EventTeamCombobox from '@/components/events/EventTeamCombobox';

interface Props {
  event: EventsJoined;
  round: EventRoundsRow;
}

export default function AddMatchForm({ event, round }: Props) {
  const teams = event.teams.map(({ id }) => id);
  async function addEventTeamSA(data: FormData) {
    'use server';
    return addRoundMatch(event, round, data);
  }

  return (
    <ActionForm
      action={addEventTeamSA}
      successMessage="Successfully aded team"
      errorMessage="Failed to add team"
    >
      <div className="flex gap-2 items-center">
        <EventTeamCombobox name="home_team" placeholder="Home team" teams={teams} />
        <EventTeamCombobox name="away_team" placeholder="Away team" teams={teams} />
        <TransitionWrapper>
          <IconBtn
            type="submit"
            Icon={PlusCircleIcon}
            size="sm"
            className="text-success"
          />
        </TransitionWrapper>
      </div>
    </ActionForm>
  );
}
