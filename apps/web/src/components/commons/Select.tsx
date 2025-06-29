import { ChangeEventHandler } from 'react';

interface Props {
  options: Array<[string | number, string]>;
  defaultValue?: string | number;
  placeholder?: string;
  label: string;
  name: string;
  disabled?: boolean;
  readonly?: boolean;
  className?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  value?: string | number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}
export default function Select({
  options,
  defaultValue,
  placeholder,
  label,
  name,
  disabled,
  readonly,
  className,
  onChange,
  value,
  size = 'md',
}: Props) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>
        <span className="label-text">{label}</span>
      </label>
      {readonly && defaultValue && (
        <input type="hidden" name={name} value={defaultValue} />
      )}
      <select
        key={defaultValue}
        name={name}
        className={`select select-${size} w-full`}
        defaultValue={defaultValue}
        disabled={disabled || readonly}
        onChange={onChange}
        value={value}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([value, name]) => (
          <option key={value} value={value}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}
