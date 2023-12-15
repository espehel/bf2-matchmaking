'use client';
import { useTransition } from 'react';

export default function TransitionWrapper({ children }: { children: React.ReactNode }) {
  const [pending] = useTransition();

  if (pending) {
    return <span className="loading loading-spinner" />;
  }

  return children;
}
