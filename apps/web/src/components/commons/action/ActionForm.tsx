'use client';
import { DetailedHTMLProps, FormHTMLAttributes, useRef } from 'react';
import { ActionFormProvider } from '@/state/ActionFormContext';
import { useFormAction } from '@/hooks/useAction';
import { FormActionFunction } from '@/lib/types/form';

export interface Props
  extends DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> {
  action: FormActionFunction;
  disabled?: boolean;
  extras?: Record<string, string>;
}

export default function ActionForm({
  action,
  children,
  extras,
  disabled,
  ...props
}: Props) {
  const ref = useRef<HTMLFormElement>(null);

  const { onSubmit, isPending } = useFormAction(action, { disabled });
  return (
    <form action={onSubmit} ref={ref} {...props}>
      {extras &&
        Object.entries(extras).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      <ActionFormProvider pending={isPending}>{children}</ActionFormProvider>
    </form>
  );
}
