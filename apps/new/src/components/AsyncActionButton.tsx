import React, { useCallback, useTransition } from 'react';
import { FetchResult } from '@bf2-matchmaking/utils';
import { toast } from 'react-toastify';

interface Props {
  children: React.ReactNode;
  action: () => Promise<FetchResult<unknown>>;
  successMessage: string;
  errorMessage: string;
  kind?: 'btn-primary' | 'btn-secondary';
}

export default function AsyncActionButton({
  children,
  action,
  successMessage,
  errorMessage,
  kind = 'btn-secondary',
}: Props) {
  let [pending, startTransition] = useTransition();

  const handleAction = useCallback(
    () =>
      startTransition(async () => {
        const result = await action();
        if (result.error) {
          toast.error(`${errorMessage}: ${result.error.message}`);
        } else {
          toast.success(successMessage);
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
