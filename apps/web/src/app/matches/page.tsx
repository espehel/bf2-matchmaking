import LiveMatchesList from '@/components/LiveMatchesList';
import PendingMatchesList from '@/components/PendingMatchesList';
import { Suspense } from 'react';
import LoadingSection from '@/components/commons/LoadingSection';
import ScheduledMatchesList from '@/components/matches/ScheduledMatchesList';

export default async function MatchesPage() {
  return (
    <main className="main">
      <h1 className="mb-8">Matches</h1>
      <Suspense fallback={<LoadingSection />}>
        <ScheduledMatchesList />
        <LiveMatchesList />
        <PendingMatchesList />
      </Suspense>
    </main>
  );
}
