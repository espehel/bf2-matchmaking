import React, { Suspense } from 'react';
import CreateChallengeSection from '@/components/challenges/CreateChallengeSection';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';

export default async function ChallengePage() {
  const challenges = await supabase(cookies).getChallenges().then(verifySingleResult);
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
            {challenges.map((challenge) => (
              <div>{challenge.config}</div>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
