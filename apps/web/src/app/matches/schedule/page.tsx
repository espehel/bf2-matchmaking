import React, { Suspense } from 'react';
import CreateMatchFromDiscordForm from '@/components/matches/schedule/CreateMatchFromDiscordForm';
import CreateMatchForm from '@/components/matches/schedule/CreateMatchForm';

export default function ScheduleMatchPage() {
  return (
    <main className="main">
      <h1 className="text-3xl font-bold">Schedule Custom Match</h1>
      <section className="section">
        <ul className="list">
          <li>
            <Suspense fallback={null}>
              <CreateMatchForm />
            </Suspense>
            <Suspense fallback={null}>
              <CreateMatchFromDiscordForm />
            </Suspense>
          </li>
        </ul>
      </section>
    </main>
  );
}
