'use client';
import { useActionForm } from '@/state/ActionFormContext';
import { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
  button?: boolean;
}
export default function TransitionWrapper({ children, button = false }: Props) {
  const { pending } = useActionForm();
  if (!pending) {
    return children;
  }
  if (button) {
    return <div className="loading loading-spinner h-12 w-12" />;
  }
  return <span className="loading loading-spinner" />;
}
