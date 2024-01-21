import ActionForm from '@/components/commons/ActionForm';
import { addEventTeam } from '@/app/events/[event]/actions';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import TeamCombobox from '@/components/TeamCombobox';
import TransitionWrapper from '@/components/commons/TransitionWrapper';
import IconBtn from '@/components/commons/IconBtn';

interface Props {
  eventId: number;
}

export default function AddTeamForm({ eventId }: Props) {
  async function addEventTeamSA(data: FormData) {
    'use server';
    return addEventTeam(eventId, data);
  }

  return (
    <ActionForm
      action={addEventTeamSA}
      successMessage="Successfully added team"
      errorMessage="Failed to add team"
    >
      <div className="flex gap-2 items-center">
        <TeamCombobox size="sm" />
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
