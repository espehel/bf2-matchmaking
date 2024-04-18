import { isAcceptedChallenge, MatchesJoined } from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import React from 'react';
import ChallengeOrganizerCommandCopyButton from '@/components/matches/ChallengeOrganizerCommandCopyButton';

interface Props {
  match: MatchesJoined;
}

export default async function ChallengeSection({ match }: Props) {
  const { data: challenge } = await supabase(cookies).getChallengeByMatchId(match.id);
  if (!isAcceptedChallenge(challenge)) {
    return null;
  }
  return (
    <section className="section max-w-md items-start text-left h-fit">
      <h2>Challenge</h2>
      <div>
        <p>Home team: {challenge.home_team.name}</p>
        <p>Home map: {challenge.home_map.name}</p>
        <p>Home server: {challenge.home_server.name}</p>
        <p>Away team: {challenge.away_team.name}</p>
        <p>Away map: {challenge.away_server.name}</p>
        <p>Away server: {challenge.away_server.name}</p>
      </div>
      <ChallengeOrganizerCommandCopyButton match={match} challenge={challenge} />
    </section>
  );
}
