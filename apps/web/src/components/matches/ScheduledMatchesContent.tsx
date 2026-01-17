import { isScheduledMatch, MatchesJoined } from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import MatchDateItems from '@/components/matches/MatchDateItems';
import Link from 'next/link';

interface Props {
  matches: MatchesJoined[];
}

export default function ScheduledMatchesContent({ matches }: Props) {
  const scheduledMatches = matches
    .filter(isScheduledMatch)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  const matchDates = [
    ...new Set(
      scheduledMatches.map((match) =>
        DateTime.fromISO(match.scheduled_at).toFormat('EEEE, MMMM d')
      )
    ),
  ];
  const hasMatches = matchDates.length > 0;

  return (
    <section className="animate-fade-in">
      {!hasMatches && (
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-base-content/70">No scheduled matches</p>
          <Link href="/matches" className="text-sm text-base-content/50 link">
            Create a match
          </Link>
        </div>
      )}
      {hasMatches && (
        <ul className="space-y-6">
          {matchDates.map((date, index) => (
            <div
              key={date}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <MatchDateItems date={date} matches={scheduledMatches} />
            </div>
          ))}
        </ul>
      )}
    </section>
  );
}
