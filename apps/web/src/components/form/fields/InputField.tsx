import { ChangeEvent } from 'react';
import { Colors, Sizes } from '@/lib/types/daisyui';
import classNames from 'classnames';

interface Props {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  tooltip?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  size?: Sizes;
  kind?: Colors | 'ghost';
}

export default function InputField({
  name,
  label,
  defaultValue,
  className,
  placeholder,
  value,
  onChange,
  size,
  kind,
}: Props) {
  const classes = classNames(
    'input',
    { [`input-${size}`]: size, [`input-${kind}`]: kind },
    className
  );
  return (
    <label className="floating-label">
      <span>{label}</span>
      <input
        className={classes}
        name={name}
        placeholder={placeholder || label}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}
