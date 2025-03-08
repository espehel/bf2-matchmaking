'use client';
import {
  ChangeEventHandler,
  DetailedHTMLProps,
  InputHTMLAttributes,
  useTransition,
} from 'react';
import { toast } from 'react-toastify';
import { parseError } from '@bf2-matchmaking/utils';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

interface Props
  extends Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    'type' | 'name'
  > {
  name: string;
  label: string;
  action: (
    formData: FormData
  ) => Promise<{ data: unknown; error: { message: string } | null } | undefined>;
  successMessage: string;
  errorMessage: string;
  extras?: Record<string, string>;
  tooltip?: string;
}

export default function ToggleAction({
  className,
  name,
  action,
  successMessage,
  errorMessage,
  extras,
  tooltip,
  label,
  ...rest
}: Props) {
  const [pending, startTransition] = useTransition();

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const formData = new FormData();
    formData.append(name, event.target.checked ? 'true' : 'false');
    if (extras) {
      for (const key in extras) {
        formData.append(key, extras[key]);
      }
    }

    startTransition(async () => {
      try {
        const result = await action(formData);
        if (!result) {
          return;
        }
        if (result.error) {
          toast.error(`${errorMessage}: ${result.error.message}`);
        } else {
          toast.success(successMessage);
        }
      } catch (e) {
        toast.error(`${errorMessage}: ${parseError(e)}`);
      }
    });
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        <input
          name={name}
          type="checkbox"
          className="toggle toggle-success"
          {...rest}
          onChange={handleChange}
          disabled={pending}
        />
        <label className="label" htmlFor={name}>
          <span className="label-text inline-flex items-center">
            <span>{label}</span>
            {tooltip && (
              <div className="tooltip tooltip-info" data-tip={tooltip}>
                <QuestionMarkCircleIcon className="bg-info-content text-info size-4 ml-1 rounded-full" />
              </div>
            )}
          </span>
        </label>
      </div>
    </div>
  );
}
