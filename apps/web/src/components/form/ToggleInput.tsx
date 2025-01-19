import { DetailedHTMLProps, InputHTMLAttributes } from 'react';

interface Props
  extends Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    'type'
  > {}

export default function ToggleInput({ className, ...rest }: Props) {
  return (
    <input
      type="checkbox"
      className={'toggle toggle-success '.concat(className || '')}
      {...rest}
    />
  );
}
