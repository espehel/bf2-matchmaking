'use client';
import React from 'react';
import { experimental_useFormStatus as useFormStatus } from 'react-dom';

interface Props {
  children: React.ReactNode;
}

export default function FormSubmitButton({ children }: Props) {
  const { pending } = useFormStatus();

  return (
    <button className="btn btn-primary w-fit" type="submit" disabled={pending}>
      {pending && <span className="loading loading-spinner"></span>}
      {children}
    </button>
  );
}
