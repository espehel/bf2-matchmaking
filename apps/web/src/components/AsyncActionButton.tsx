'use client';
import React, { useCallback, useTransition } from 'react';
import { FetchResult } from '@bf2-matchmaking/utils';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface Props {
  children: React.ReactNode;
  action: () => Promise<FetchResult<unknown>>;
  successMessage: string;
  errorMessage: string;
  kind?: 'btn-primary' | 'btn-secondary' | 'btn-error';
  redirect?: string;
}

export default function AsyncActionButton({
  children,
  action,
  successMessage,
  errorMessage,
  kind = 'btn-secondary',
  redirect,
}: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = useCallback(
    () =>
      startTransition(async () => {
        const result = await action();
        if (result.error) {
          toast.error(`${errorMessage}: ${result.error.message}`);
        } else {
          toast.success(successMessage);
          if (redirect) {
            router.push(redirect);
          }
        }
      }),
    [action, errorMessage, successMessage, startTransition]
  );

  return (
    <button className={`btn ${kind} w-fit`} onClick={handleAction} disabled={pending}>
      {pending && <span className="loading loading-spinner"></span>}
      {children}
    </button>
  );
}
