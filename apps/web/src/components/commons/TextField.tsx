import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';
import { ChangeEvent } from 'react';

interface Props {
  name: string;
  label: string;
  defaultValue?: string;
  className?: string;
  tooltip?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function TextField({
  name,
  label,
  defaultValue,
  className,
  tooltip,
  value,
  onChange,
}: Props) {
  return (
    <div className={className}>
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
      <input
        className="input  ed w-full"
        name={name}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
