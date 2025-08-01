import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';
import { isActiveLiveMatch, isDefined, MatchStatus } from '@bf2-matchmaking/types';
import { api, compareStartedAt, verify } from '@bf2-matchmaking/utils';
import LiveMatchCard from '@/components/LiveMatchCard';

export default async function LiveMatchesList() {
  const cookieStore = await cookies();
  const matches = await supabase(cookieStore)
    .getMatchesWithStatus(MatchStatus.Ongoing)
    .then(verifyResult);
  const liveMatches = await api.v2.getMatches().then(verify);

  const mergedMatches = liveMatches
    .filter(isActiveLiveMatch)
    .map(({ matchId, server, state }) => ({
      match: matches.find((m) => m.id === matchId),
      liveInfo: server?.live,
      liveState: state,
    }))
    .sort(({ match: matchA }, { match: matchB }) => compareStartedAt(matchA, matchB));

  const hasLiveMatches = mergedMatches.length > 0;

  return (
    <section className="max-w-4xl m-auto">
      <h2 className="mb-8 text-xl font-bold text-left text-base-content">Live matches</h2>
      {!hasLiveMatches && (
        <p className="flex items-center gap-8 px-8 border-2 border-primary rounded bg-base-100 h-28 text-xl">
          Currently no live matches...
        </p>
      )}
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
