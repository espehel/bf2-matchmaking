import React, { Suspense } from 'react';
import CreateChallengeSection from '@/components/challenges/CreateChallengeSection';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import OpenChallengeCard from '@/components/challenges/OpenChallengeCard';
import { isAcceptedChallenge } from '@bf2-matchmaking/types';
import AcceptChallengeModal from '@/components/challenges/AcceptChallengeModal';
import AcceptedChallengeCard from '@/components/challenges/AcceptedChallengeCard';

export default async function ChallengePage() {
  const challenges = await supabase(cookies).getChallenges().then(verifySingleResult);
  const openChallenges = challenges.filter((challenge) => challenge.status === 'open');
  const acceptedChallenges = challenges.filter(isAcceptedChallenge);

  return (
    <main className="main">
      <h1 className="mb-6">Challenges</h1>
      <div className="flex gap-4">
        <Suspense fallback={null}>
          <CreateChallengeSection />
        </Suspense>
        <section className="section">
          <h2>Open Challenges</h2>
          <ul>
            {openChallenges.map((challenge) => (
              <OpenChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </ul>
        </section>
        <section className="section">
          <h2>Accepted Challenges</h2>
          <ul>
            {acceptedChallenges.map((challenge) => (
              <AcceptedChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
