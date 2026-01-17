import Link from 'next/link';
import { isActiveLiveMatch, isDefined, MatchesJoined, LiveMatch } from '@bf2-matchmaking/types';
import { compareStartedAt } from '@bf2-matchmaking/utils';
import LiveMatchCard from '@/components/LiveMatchCard';
import MatchCard from '@/components/MatchCard';

interface Props {
  matches: MatchesJoined[];
  liveMatches: LiveMatch[];
}

export default function OngoingMatchesContent({ matches, liveMatches }: Props) {
  const mergedLiveMatches = liveMatches
    .filter(isActiveLiveMatch)
    .map(({ matchId, server, state }) => ({
      match: matches.find((m) => m.id === matchId),
      liveInfo: server?.live,
      liveState: state,
    }))
    .sort(({ match: matchA }, { match: matchB }) => compareStartedAt(matchA, matchB));

  const pendingMatches = matches
    .filter((m) => !liveMatches.some(({ matchId }) => matchId === m.id))
    .sort(compareStartedAt);

  const hasLiveMatches = mergedLiveMatches.length > 0;
  const hasPendingMatches = pendingMatches.length > 0;
  const hasAnyMatches = hasLiveMatches || hasPendingMatches;

  return (
    <section className="animate-fade-in">
      {!hasAnyMatches && (
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 rounded-lg bg-base-200/50 border border-base-300">
          <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-base-content/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-base-content/70">No ongoing matches</p>
          <p className="text-sm text-base-content/50">
            Check back later or schedule a new match
          </p>
        </div>
      )}
      {hasLiveMatches && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/70">
              Live Now
            </h3>
          </div>
          <ul className="space-y-4">
            {mergedLiveMatches.map(({ match, liveInfo, liveState }) =>
              isDefined(match) ? (
                <li key={match.id} className="animate-slide-up">
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
        </div>
      )}
      {hasPendingMatches && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="w-2 h-2 bg-warning rounded-full" />
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/70">
              Pending
            </h3>
          </div>
          <ul className="space-y-4">
            {pendingMatches.map((match, index) => (
              <li
                key={match.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Link href={`/matches/${match.id}`}>
                  <MatchCard match={match} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}