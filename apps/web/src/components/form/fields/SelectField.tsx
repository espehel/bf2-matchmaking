import React, { ChangeEventHandler, ReactEventHandler } from 'react';
import classNames from 'classnames';

const colors = {
  primary: 'select-primary',
  secondary: 'select-secondary',
  accent: 'select-accent',
  neutral: 'select-neutral',
  info: 'select-info',
  success: 'select-success',
  warning: 'select-warning',
  error: 'select-error',
  ghost: 'select-ghost',
} as const;
const sizes = {
  xs: 'select-xs',
  sm: 'select-sm',
  md: 'select-md',
  lg: 'select-lg',
  xl: 'select-xl',
} as const;

export interface SelectFieldProps {
  options: Array<[string | number | undefined, string]> | Array<string>;
  defaultValue?: string | number | null;
  placeholder?: string;
  label?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  onSelect?: ReactEventHandler<HTMLSelectElement>;
  value?: string | number;
  size?: keyof typeof sizes;
  kind?: keyof typeof colors;
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
  kind = 'neutral',
  disabled,
}: SelectFieldProps) {
  const classes = classNames('select', sizes[size], colors[kind], className);
  return (
    <label className={classes}>
      {label && <span className="label">{label}</span>}
      <select
        name={name}
        defaultValue={value ? undefined : (defaultValue ?? '')}
        onChange={onChange}
        onSelect={onSelect}
        value={value}
        disabled={disabled}
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
