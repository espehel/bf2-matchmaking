'use client';
import React from 'react';
import { useActionForm } from '@/state/ActionFormContext';
import TransitionWrapper from '@/components/commons/TransitionWrapper';
interface Props {
  children: React.ReactNode;
  disabled?: boolean;
}

export default function SubmitActionFormButton({ children, disabled }: Props) {
  const { pending } = useActionForm();
  return (
    <button
      className="btn btn-primary w-fit"
      type="submit"
      disabled={disabled || pending}
    >
      <TransitionWrapper keepSize={true}>{children}</TransitionWrapper>
    </button>
  );
}
