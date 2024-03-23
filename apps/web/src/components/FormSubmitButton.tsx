'use client';
import React from 'react';
import { useFormStatus } from 'react-dom';
interface Props {
  children: React.ReactNode;
  disabled?: boolean;
}

export default function FormSubmitButton({ children, disabled }: Props) {
  const { pending } = useFormStatus();

  return (
    <button
      className="btn btn-primary w-fit"
      type="submit"
      disabled={disabled || pending}
    >
      {pending && <span className="loading loading-spinner"></span>}
      {children}
    </button>
  );
}
