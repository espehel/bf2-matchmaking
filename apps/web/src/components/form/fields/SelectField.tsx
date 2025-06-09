import { ChangeEventHandler, ReactEventHandler } from 'react';
import classNames from 'classnames';
import { Colors, Sizes } from '@/lib/types/daisyui';

interface Props {
  options: Array<[string | number, string]>;
  defaultValue?: string | number;
  placeholder?: string;
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
  name,
  className,
  onChange,
  onSelect,
  value,
  size = 'md',
  kind,
}: Props) {
  const classes = classNames(
    'select',
    `select-${size}`,
    { [`select-${kind}`]: kind, [`select-${size}`]: size },
    className
  );
  return (
    <select
      key={defaultValue}
      name={name}
      className={classes}
      defaultValue={defaultValue}
      onChange={onChange}
      onSelect={onSelect}
      value={value}
    >
      {placeholder && (
        <option disabled={true} value="">
          {placeholder}
        </option>
      )}
      {options.map(([value, name]) => (
        <option key={value} value={value}>
          {name}
        </option>
      ))}
    </select>
  );
}
