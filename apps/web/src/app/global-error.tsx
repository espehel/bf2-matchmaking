'use client';

import { useEffect } from 'react';
import { logError } from '@/app/actions';
import Link from 'next/link';
import { PaperAirplaneIcon } from '@heroicons/react/20/solid';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError(JSON.stringify(error))
      .then(() => console.error(error.message))
      .catch((err) => console.error(err));
  }, [error]);

  return (
    <html>
      <body>
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
      </body>
    </html>
  );
}
