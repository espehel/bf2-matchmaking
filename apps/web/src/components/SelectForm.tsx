import { ArrowRightCircleIcon } from '@heroicons/react/24/solid';
import FormSubmitButton from '@/components/FormSubmitButton';
import { useCallback } from 'react';
import { isString } from '@bf2-matchmaking/types';

interface Props {
  options: Array<[string | number, string]>;
  defaultValue?: string | number;
  action: (value: string) => void;
}
export default function SelectForm({ options, action, defaultValue }: Props) {
  const handleFormAction = useCallback(
    (data: FormData) => {
      const value = data.get('select');
      if (isString(value)) {
        action(value);
      }
    },
    [action]
  );

  return (
    <form action={handleFormAction} className="form-control">
      <label className="label">
        <span className="label-text">Set server</span>
      </label>
      <div className="flex items-center gap-2">
        <select
          name="select"
          className="select select-bordered"
          defaultValue={defaultValue}
        >
          {options.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <FormSubmitButton>
          <ArrowRightCircleIcon className="h-6" />
        </FormSubmitButton>
      </div>
    </form>
  );
}
