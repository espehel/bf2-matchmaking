import LiveMatchesList from '@/components/LiveMatchesList';
import PendingMatchesList from '@/components/PendingMatchesList';
import { Suspense } from 'react';
import LoadingSection from '@/components/commons/LoadingSection';

export default async function MatchesPage() {
  return (
    <main className="main text-center">
      <h1 className="mb-8">Matches</h1>
      <Suspense fallback={<LoadingSection />}>
        <LiveMatchesList />
        <PendingMatchesList />
      </Suspense>
    </main>
  );
}
