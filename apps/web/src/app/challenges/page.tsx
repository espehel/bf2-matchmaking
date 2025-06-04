import React from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import ManageTeamsSection from '@/components/challenges/ManageTeamsSection';
import { isOpenChallenge } from '@bf2-matchmaking/utils';
import AuthButton from '@/components/AuthButton';
import { TeamsRow } from '@bf2-matchmaking/types';
import OpenChallengeCard from '@/components/challenges/OpenChallengeCard';
import LeaderboardSection from '@/components/challenges/LeaderboardSection';

async function getPlayerTeams(): Promise<Array<TeamsRow> | null> {
  const cookieStore = await cookies();
  const { data: player } = await supabase(cookieStore).getSessionPlayer();
  if (!player) {
    return null;
  }
  const { data: playerTeams } = await supabase(cookieStore).getTeamsByPlayerId(player.id);
  return playerTeams;
}

export default async function ChallengePage() {
  const cookieStore = await cookies();
  const challenges = await supabase(cookieStore).getChallenges().then(verifySingleResult);
  const openChallenges = challenges.filter(isOpenChallenge);
  const playerTeams = await getPlayerTeams();

  return (
    <main className="main">
      <h1>Challenges</h1>
      <div className="flex flex-wrap gap-16 p-8">
        {playerTeams ? (
          <ManageTeamsSection teams={playerTeams} />
        ) : (
          <section className="section">
            <h2>You are not logged in</h2>
            <AuthButton className="btn btn-accent w-20" user={null} />
          </section>
        )}
        <LeaderboardSection />
        <section className="section">
          <h2>Open Challenges</h2>
          <ul>
            {openChallenges.length ? (
              openChallenges.map((challenge) => (
                <li key={challenge.id} className="mb-2 last:mb-0">
                  <OpenChallengeCard key={challenge.id} challenge={challenge} readOnly />
                </li>
              ))
            ) : (
              <p className="font-light min-w-96">No open challenges</p>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
