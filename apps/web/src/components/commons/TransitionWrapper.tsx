'use client';
import { useActionForm } from '@/state/ActionFormContext';
import { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
  button?: boolean;
  keepSize?: boolean;
}
export default function TransitionWrapper({
  children,
  button = false,
  keepSize = false,
}: Props) {
  const { pending } = useActionForm();
  if (!pending) {
    return children;
  }
  if (button) {
    return <div className="loading loading-spinner h-12 w-12" />;
  }
  if (keepSize) {
    return (
      <div className="relative">
        <div className="invisible">{children}</div>
        <div className="absolute left-0 top-0 w-full h-full -translate-y-2/4">
          <div className="loading loading-spinner" />
        </div>
      </div>
    );
  }
  return <span className="loading loading-spinner" />;
}
