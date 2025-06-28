import React, { Suspense } from 'react';
import CreateChallengeSection from '@/components/challenges/CreateChallengeSection';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import OpenChallengeCard from '@/components/challenges/OpenChallengeCard';
import { isAcceptedChallenge, isPendingChallenge } from '@bf2-matchmaking/types';
import AcceptedChallengeCard from '@/components/challenges/AcceptedChallengeCard';
import PendingChallengeCard from '@/components/challenges/PendingChallengeCard';
import { hasTeam, isOpenChallenge, isSignedUp } from '@bf2-matchmaking/utils';

interface Props {
  params: Promise<{ team: string }>;
}
export default async function ChallengePage(props: Props) {
  const params = await props.params;
  const cookieStore = await cookies();
  const selectedTeam = await supabase(cookieStore)
    .getTeam(Number(params.team))
    .then(verifySingleResult);
  const challenges = await supabase(cookieStore).getChallenges().then(verifyResult);
  const openChallenges = challenges
    .filter(isOpenChallenge)
    .filter(isSignedUp(selectedTeam));
  const acceptedChallenges = challenges
    .filter(isAcceptedChallenge)
    .filter(hasTeam(selectedTeam?.id));
  const pendingChallenges = challenges
    .filter(isPendingChallenge)
    .filter(hasTeam(selectedTeam?.id));

  return (
    <div className="flex gap-4">
      <Suspense fallback={null}>
        <CreateChallengeSection selectedTeam={selectedTeam} />
      </Suspense>
      <div className="flex flex-col gap-4">
        <section className="section">
          <h2>Open Challenges</h2>
          <ul>
            {openChallenges.length ? (
              openChallenges.map((challenge) => (
                <li key={challenge.id} className="mb-2 last:mb-0">
                  <OpenChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    readOnly={challenge.home_team.id === selectedTeam?.id}
                  />
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
  );
}
