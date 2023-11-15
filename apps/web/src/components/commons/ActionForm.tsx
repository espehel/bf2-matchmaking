'use client';
import { DetailedHTMLProps, FormHTMLAttributes, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface Props
  extends DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> {
  action: (
    formData: FormData
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
  successMessage: string;
  errorMessage: string;
  redirect?: string;
  className?: string;
}

export default function ActionForm({
  action,
  successMessage,
  errorMessage,
  redirect,
  children,
  ...props
}: Props) {
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = useCallback(
    (formData: FormData) =>
      startTransition(async () => {
        const result = await action(formData);

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
    <form action={handleAction} {...props}>
      {children}
    </form>
  );
}
