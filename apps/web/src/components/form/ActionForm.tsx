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
import { parseError } from '@bf2-matchmaking/utils';

export interface Props
  extends DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> {
  formAction: (
    formData: FormData
  ) => Promise<{ data: unknown; error: { message: string } | null } | undefined>;
  successMessage: string;
  errorMessage: string;
  redirect?: string;
  className?: string;
  onSuccess?: () => void;
  resetOnSuccess?: boolean;
  disabled?: boolean;
  extras?: Record<string, string>;
}

export default function ActionForm({
  formAction,
  onSuccess,
  successMessage,
  errorMessage,
  redirect,
  children,
  resetOnSuccess = true,
  extras,
  ...props
}: Props) {
  const ref = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = useCallback(
    (formData: FormData) =>
      startTransition(async () => {
        try {
          const result = await formAction(formData);
          if (!result) {
            return;
          }
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
        } catch (e) {
          toast.error(`${errorMessage}: ${parseError(e)}`);
        }
      }),
    [formAction, errorMessage, successMessage, startTransition, redirect, router]
  );
  return (
    <form action={handleAction} ref={ref} {...props}>
      {extras &&
        Object.entries(extras).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
      <ActionFormProvider pending={pending}>{children}</ActionFormProvider>
    </form>
  );
}
