import { PropsWithChildren } from 'react';
import { Sizes } from '@/lib/types/daisyui';
import classNames from 'classnames';

type Props = PropsWithChildren<{
  legend?: string;
  size?: Sizes;
  className?: string;
  helpText?: string;
}>;

export default function Fieldset({ legend, children, size, helpText, className }: Props) {
  const classes = classNames(
    'fieldset bg-base-300 border-primary rounded-box border p-4 gap-2',
    { [`fieldset-${size}`]: size },
    className
  );
  return (
    <fieldset className={classes}>
      {legend && <legend className="fieldset-legend">{legend}</legend>}
      {children}
      {helpText && <p className="label">{helpText}</p>}
    </fieldset>
  );
}
