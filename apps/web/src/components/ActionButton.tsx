'use client';
import React, { PropsWithChildren, useCallback, useTransition } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface Props extends PropsWithChildren {
  action: () => Promise<{ data: unknown; error: { message: string } | null }>;
  successMessage: string;
  errorMessage: string;
  kind?: 'btn-primary' | 'btn-secondary' | 'btn-error';
  size?: 'btn-lg' | 'btn-md' | 'btn-sm';
  fit?: 'w-fit' | 'w-full';
  redirect?: string;
  errorRedirect?: string;
  disabled?: boolean;
}

export default function ActionButton({
  children,
  action,
  successMessage,
  errorMessage,
  kind = 'btn-secondary',
  size = 'btn-md',
  fit = 'w-fit',
  redirect,
  errorRedirect,
  disabled,
}: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = useCallback(
    () =>
      startTransition(async () => {
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

  return (
    <button
      className={`btn ${kind} ${size} ${fit} ${disabled || pending ? 'btn-outline' : ''}`}
      onClick={handleAction}
      disabled={disabled || pending}
    >
      {pending && <span className="loading loading-spinner"></span>}
      {children}
    </button>
  );
}
