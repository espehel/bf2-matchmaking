import React, { Suspense } from 'react';
import CreateChallengeSection from '@/components/challenges/CreateChallengeSection';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import OpenChallengeCard from '@/components/challenges/OpenChallengeCard';
import {
  Challenge,
  isAcceptedChallenge,
  isPendingChallenge,
} from '@bf2-matchmaking/types';
import AcceptedChallengeCard from '@/components/challenges/AcceptedChallengeCard';
import PendingChallengeCard from '@/components/challenges/PendingChallengeCard';

export default async function ChallengePage() {
  const challenges = await supabase(cookies).getChallenges().then(verifySingleResult);
  const playerTeams = await supabase(cookies).getSessionPlayerTeamIds();
  const openChallenges = challenges.filter((challenge) => challenge.status === 'open');
  const acceptedChallenges = challenges.filter(isAcceptedChallenge);
  const pendingChallenges = challenges
    .filter(isPendingChallenge)
    .filter(isPlayerChallenge(playerTeams));

  return (
    <main className="main">
      <h1 className="mb-6">Challenges</h1>
      <div className="flex gap-4">
        <Suspense fallback={null}>
          <CreateChallengeSection />
        </Suspense>
        <div className="flex flex-col gap-4">
          <section className="section">
            <h2>Open Challenges</h2>
            <ul>
              {openChallenges.length ? (
                openChallenges.map((challenge) => (
                  <li key={challenge.id} className="mb-2 last:mb-0">
                    <OpenChallengeCard key={challenge.id} challenge={challenge} />
                  </li>
                ))
              ) : (
                <p className="font-light">No open challenges</p>
              )}
            </ul>
          </section>
          <section className="section">
            <h2>Your pending Challenges</h2>
            <ul>
              {pendingChallenges.length ? (
                pendingChallenges.map((challenge) => (
                  <li key={challenge.id} className="mb-2 last:mb-0">
                    <PendingChallengeCard challenge={challenge} />
                  </li>
                ))
              ) : (
                <p>Your team has no pending challenges</p>
              )}
            </ul>
          </section>
          <section className="section">
            <h2>Accepted Challenges</h2>
            <ul>
              {acceptedChallenges.length ? (
                acceptedChallenges.map((challenge) => (
                  <li key={challenge.id} className="mb-2 last:mb-0">
                    <AcceptedChallengeCard key={challenge.id} challenge={challenge} />
                  </li>
                ))
              ) : (
                <p>No accepted challenges</p>
              )}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}

function isPlayerChallenge(playerTeams: Array<number>) {
  return (challenge: Challenge) =>
    playerTeams.includes(challenge.home_team.id) ||
    (challenge.away_team && playerTeams.includes(challenge.away_team.id));
}
