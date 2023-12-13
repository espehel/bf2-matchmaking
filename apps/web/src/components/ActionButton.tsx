'use client';
import React, { PropsWithChildren, useCallback, useTransition } from 'react';
import { FetchResult } from '@bf2-matchmaking/utils';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface Props extends PropsWithChildren {
  action: () => Promise<{ data: unknown; error: { message: string } | null }>;
  successMessage: string;
  errorMessage: string;
  kind?: 'btn-primary' | 'btn-secondary' | 'btn-error';
  redirect?: string;
  errorRedirect?: string;
}

export default function ActionButton({
  children,
  action,
  successMessage,
  errorMessage,
  kind = 'btn-secondary',
  redirect,
  errorRedirect,
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
    <button className={`btn ${kind} w-fit`} onClick={handleAction} disabled={pending}>
      {pending && <span className="loading loading-spinner"></span>}
      {children}
    </button>
  );
}
