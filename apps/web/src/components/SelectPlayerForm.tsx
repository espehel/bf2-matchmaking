import { ArrowRightCircleIcon } from '@heroicons/react/24/solid';
import FormSubmitButton from '@/components/FormSubmitButton';
import { useCallback } from 'react';
import { isString } from '@bf2-matchmaking/types';
import PlayerCombobox from '@/components/PlayerCombobox';

interface Props {
  action: (value: string) => void;
}
export default function SelectPlayerForm({ action }: Props) {
  const handleFormAction = useCallback(
    (data: FormData) => {
      const value = data.get('select-player');
      if (isString(value)) {
        action(value);
      }
    },
    [action]
  );

  return (
    <form action={handleFormAction} className=" flex flex-col">
      <label className="label">
        <span className="label-text">Select player</span>
      </label>
      <div className="flex items-center gap-2">
        <PlayerCombobox />
        <FormSubmitButton>
          <ArrowRightCircleIcon className="h-6" />
        </FormSubmitButton>
      </div>
    </form>
  );
}
