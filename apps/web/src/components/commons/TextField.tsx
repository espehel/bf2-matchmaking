import { QuestionMarkCircleIcon } from '@heroicons/react/24/solid';

interface Props {
  name: string;
  label: string;
  defaultValue?: string;
  className?: string;
  tooltip?: string;
}

export default function TextField({
  name,
  label,
  defaultValue,
  className,
  tooltip,
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
        className="input input-bordered w-full"
        name={name}
        defaultValue={defaultValue}
      />
    </div>
  );
}
