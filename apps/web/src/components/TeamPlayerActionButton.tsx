'use client';
import { useCallback, useTransition } from 'react';
import * as React from 'react';
import { FetchResult } from '@bf2-matchmaking/utils';
import { toast } from 'react-toastify';
import { useMatch } from '@/state/MatchContext';

interface Props {
  children: React.ReactNode;
  action: () => Promise<FetchResult<unknown>>;
  errorMessage: string;
  successMessage: string;
}

export default function TeamPlayerActionButton({
  children,
  action,
  errorMessage,
  successMessage,
}: Props) {
  const [pending, startTransition] = useTransition();
  const { isMatchOfficer } = useMatch();

  const handlePlayerAction = useCallback(() => {
    startTransition(async () => {
      const { error } = await action();
      if (error) {
        toast.error(errorMessage);
      } else {
        toast.success(successMessage);
      }
    });
  }, [action, errorMessage, successMessage, startTransition]);

  if (!isMatchOfficer) {
    return null;
  }

  return (
    <button
      onClick={handlePlayerAction}
      className="btn btn-sm btn-circle btn-ghost ml-auto"
      disabled={pending}
    >
      {pending ? <div className="loading loading-spinner loading-sm" /> : children}
    </button>
  );
}
