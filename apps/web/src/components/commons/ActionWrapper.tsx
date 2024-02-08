'use client';
import React, { PropsWithChildren, useCallback, useTransition } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface Props extends PropsWithChildren {
  action: () => Promise<{ data: unknown; error: { message: string } | null }>;
  successMessage: string;
  errorMessage: string;
  kind?: 'btn-primary' | 'btn-secondary' | 'btn-error';
  redirect?: string;
  errorRedirect?: string;
  visible?: boolean;
  disabled?: boolean;
}

export default function ActionWrapper({
  children,
  action,
  successMessage,
  errorMessage,
  redirect,
  errorRedirect,
  visible = true,
  disabled,
}: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = useCallback(
    () =>
      startTransition(async () => {
        if (disabled) {
          return;
        }
        const result = await action();
        if (result.error) {
          toast.error(`${errorMessage}: ${result.error.message}`);
          if (errorRedirect) {
            router.push(errorRedirect);
          }
        } else {
          toast.success(successMessage);
          if (redirect) {
            router.push(redirect);
          }
        }
      }),
    [
      action,
      errorMessage,
      successMessage,
      startTransition,
      redirect,
      router,
      errorRedirect,
    ]
  );

  if (!visible) {
    return null;
  }

  if (pending) {
    return <span className="loading loading-spinner" />;
  }

  return (
    <span role="button" onClick={handleAction} className="w-fit h-fit">
      {children}
    </span>
  );
}
