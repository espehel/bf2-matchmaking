'use client';
import { experimental_useFormStatus as useFormStatus } from 'react-dom';
import { ArrowPathIcon } from '@heroicons/react/20/solid';

export default function RefreshButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-ghost btn-circle btn-sm text-accent" type="submit">
      <ArrowPathIcon className={pending ? 'animate-spin' : ''} />
    </button>
  );
}
