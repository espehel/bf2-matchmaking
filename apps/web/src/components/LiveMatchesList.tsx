import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';
import { isDefined, MatchStatus } from '@bf2-matchmaking/types';
import { api, compareStartedAt, verify } from '@bf2-matchmaking/utils';
import LiveMatchCard from '@/components/LiveMatchCard';

export default async function LiveMatchesList() {
  const matches = await supabase(cookies)
    .getMatchesWithStatus(MatchStatus.Ongoing)
    .then(verifyResult);
  const liveMatches = await api.live().getMatches().then(verify);

  const mergedMatches = liveMatches
    .map(({ liveInfo, liveState, matchId }) => ({
      match: matches.find((m) => m.id === matchId),
      liveInfo,
      liveState,
    }))
    .sort(({ match: matchA }, { match: matchB }) => compareStartedAt(matchA, matchB));

  const hasLiveMatches = mergedMatches.length > 0;

  return (
    <section className="max-w-4xl m-auto">
      <h2 className="mb-8 text-xl font-bold text-left text-base-content">Live matches</h2>
      {!hasLiveMatches && <p>Currently no live matches...</p>}
      {hasLiveMatches && (
        <ul>
          {mergedMatches.map(({ match, liveInfo, liveState }) =>
            isDefined(match) ? (
              <li key={match.id} className="mb-4">
                <Link href={`/matches/${match.id}`}>
                  <LiveMatchCard
                    match={match}
                    liveState={liveState}
                    liveInfo={liveInfo}
                  />
                </Link>
              </li>
            ) : null
          )}
        </ul>
      )}
    </section>
  );
}
