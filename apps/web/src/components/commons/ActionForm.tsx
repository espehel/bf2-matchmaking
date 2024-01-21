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
}

export default function ActionForm({
  action,
  onSuccess,
  successMessage,
  errorMessage,
  redirect,
  children,
  ...props
}: Props) {
  const ref = useRef<HTMLFormElement>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = useCallback(
    (formData: FormData) =>
      startTransition(async () => {
        const result = await action(formData);

        if (result.error) {
          toast.error(`${errorMessage}: ${result.error.message}`);
        } else {
          ref.current?.reset();
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
      {children}
    </form>
  );
}
