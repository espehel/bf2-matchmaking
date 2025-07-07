import React, { ChangeEventHandler, ReactEventHandler } from 'react';
import classNames from 'classnames';
import { Colors, Sizes } from '@/lib/types/daisyui';

interface Props {
  options: Array<[string | number | undefined, string]> | Array<string>;
  defaultValue?: string | number | null;
  placeholder?: string;
  label?: string;
  name?: string;
  className?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  onSelect?: ReactEventHandler<HTMLSelectElement>;
  value?: string | number;
  size?: Sizes;
  kind?: Colors | 'ghost';
}
export default function SelectField({
  options,
  defaultValue,
  placeholder,
  label,
  name,
  className,
  onChange,
  onSelect,
  value,
  size = 'md',
  kind,
}: Props) {
  const classes = classNames(
    'select floating-label',
    `select-${size}`,
    { [`select-${kind}`]: kind, [`select-${size}`]: size },
    className
  );
  return (
    <label className={classes}>
      {label && <span>{label}</span>}
      <select
        name={name}
        defaultValue={value ? undefined : defaultValue ?? ''}
        onChange={onChange}
        onSelect={onSelect}
        value={value}
      >
        {placeholder && (
          <option disabled={true} value="">
            {placeholder}
          </option>
        )}
        {options.map(toTuple).map(([oValue, oName]) => (
          <option key={`${oValue}${oName}`} value={oValue}>
            {oName}
          </option>
        ))}
      </select>
    </label>
  );
}

function toTuple(
  o: [string | number | undefined, string] | string
): [string | number | undefined, string] {
  return Array.isArray(o) ? o : [o, o];
}
