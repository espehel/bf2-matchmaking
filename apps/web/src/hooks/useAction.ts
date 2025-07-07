'use client';

import { useCallback, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export type ActionInput = Record<string, string | number | boolean | null>;
export type ActionFunction = (input: ActionInput) => Promise<{
  success: string | null;
  error: string | null;
  redirect?: string;
}>;

export type ActionOptions = {
  disabled?: boolean;
};

export function useAction(action: ActionFunction, options: ActionOptions = {}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { disabled = false } = options;

  const trigger = useCallback(
    (input: ActionInput) =>
      startTransition(async () => {
        if (disabled) {
          return;
        }
        const { success, error, redirect } = await action(input);
        if (error) {
          toast.error(error);
        } else {
          toast.success(success);
        }
        if (redirect) {
          router.push(redirect);
        }
      }),
    [action, startTransition, router, disabled]
  );
  return useMemo(() => ({ trigger, isPending }), [action, isPending]);
}
