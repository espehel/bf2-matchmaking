import React, { Suspense } from 'react';
import ScheduleMatchForm, {
  ScheduledMatchFormFallback,
} from '@/components/matches/ScheduleMatchForm';

export default function ScheduleMatchPage() {
  return (
    <main className="main">
      <h1 className="text-3xl font-bold">Schedule Custom Match</h1>
      <section className="section">
        <ul>
          <li>
            <Suspense fallback={<ScheduledMatchFormFallback />}>
              <ScheduleMatchForm />
            </Suspense>
          </li>
        </ul>
      </section>
    </main>
  );
}
