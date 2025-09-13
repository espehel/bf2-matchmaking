import ActionForm from '@/components/form/ActionForm';
import { addEventRound } from '@/app/events/[event]/actions';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import TransitionWrapper from '@/components/commons/TransitionWrapper';
import IconBtn from '@/components/commons/IconBtn';

interface Props {
  eventId: number;
}

export default function AddRoundForm({ eventId }: Props) {
  async function addEventRoundSA(data: FormData) {
    'use server';
    return addEventRound(eventId, data);
  }

  return (
    <ActionForm
      formAction={addEventRoundSA}
      successMessage="Successfully aded team"
      errorMessage="Failed to add team"
    >
      <div className="flex gap-2 items-end">
        <div className="flex-col">
          <h3>Add round</h3>
          <input
            type="text"
            name="label"
            placeholder="Round label"
            className="input input-sm"
          />
        </div>
        <label className="flex-col items-start">
          <div className="label-text">Start date</div>
          <input
            type="date"
            name="start-at"
            placeholder="Start date"
            className="input input-sm"
          />
        </label>
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
