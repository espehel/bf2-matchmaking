import React, {
  ChangeEvent,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  SVGProps,
} from 'react';
import { Colors, Sizes } from '@/lib/types/daisyui';
import classNames from 'classnames';

interface Props {
  name: string;
  label?: string;
  placeholder?: string;
  Icon?: ForwardRefExoticComponent<PropsWithoutRef<SVGProps<SVGSVGElement>>>;
  defaultValue?: string | number;
  className?: string;
  tooltip?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  size?: Sizes;
  kind?: Colors | 'ghost';
  type?: 'text' | 'number' | 'email' | 'password';
  required?: boolean;
}

export default function InputField({
  name,
  label,
  defaultValue,
  className,
  placeholder,
  Icon,
  value,
  onChange,
  size,
  kind,
  type,
  required,
}: Props) {
  const classes = classNames(
    'input floating-label',
    { [`input-${size}`]: size, [`input-${kind}`]: kind },
    className
  );
  return (
    <label className={classes}>
      {label && <span>{label}</span>}
      {Icon && <Icon />}
      <input
        className="grow"
        name={name}
        placeholder={placeholder || label}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        type={type}
        required={required}
      />
    </label>
  );
}
