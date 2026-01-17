import { Suspense } from 'react';
import LoadingSection from '@/components/commons/LoadingSection';
import ScheduleMatchForm from '@/components/matches/ScheduleMatchForm';

export default async function MatchesPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold mb-6">Create Match</h1>
      <Suspense fallback={<LoadingSection />}>
        <ScheduleMatchForm />
      </Suspense>
    </div>
  );
}
