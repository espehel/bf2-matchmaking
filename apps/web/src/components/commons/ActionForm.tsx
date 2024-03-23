'use client';
import {
  DetailedHTMLProps,
  FormHTMLAttributes,
  useCallback,
  useRef,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { ActionFormProvider } from '@/state/ActionFormContext';
import { parseError, toFetchError } from '@bf2-matchmaking/utils';

export interface Props
  extends DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> {
  action: (
    formData: FormData
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  successMessage: string;
  errorMessage: string;
  redirect?: string;
  className?: string;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
  disabled?: boolean;
}

export default function ActionForm({
  action,
  onSuccess,
  successMessage,
  errorMessage,
  redirect,
  children,
  resetOnSuccess = true,
  ...props
}: Props) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = useCallback(
    (formData: FormData) =>
      startTransition(async () => {
        const result = await action(formData);

        if (result.error) {
          toast.error(`${errorMessage}: ${result.error.message}`);
        } else {
          if (resetOnSuccess) {
            ref.current?.reset();
          }
          toast.success(successMessage);
          if (redirect) {
            router.push(redirect);
          }
          if (onSuccess) {
            onSuccess();
          }
        }
      }),
    [action, errorMessage, successMessage, startTransition, redirect, router]
  );
  return (
    <form action={handleAction} ref={ref} {...props}>
      <ActionFormProvider pending={pending}>{children}</ActionFormProvider>
    </form>
  );
}
