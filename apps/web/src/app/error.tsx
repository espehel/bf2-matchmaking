'use client';

import { useEffect } from 'react';
import { logError } from '@/app/actions';
import Link from 'next/link';
import { PaperAirplaneIcon } from '@heroicons/react/20/solid';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    const location = window.location.href;
    const userAgent = window.navigator.userAgent;
    const { message, name, cause, stack, digest } = error;
    logError(message, { location, userAgent, name, cause, stack, digest })
      .then(() => console.error(error.message))
      .catch((err) => console.error(err));
  }, [error]);

  return (
    <main className="main">
      <section className="section">
        <h2>Something went wrong!</h2>
        <p>Try again or contact Artic@discord</p>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => reset()}>
            Try again
          </button>
          <Link
            className="btn btn-secondary"
            href="https://discord.com/channels/@me/1057027470655770654"
            target="_blank"
          >
            Artic
            <PaperAirplaneIcon className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
