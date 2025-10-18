import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import RoundsList from '@/components/RoundsList';
import MatchResultSection from '@/components/result/MatchResultSection';
import { MatchStatus } from '@bf2-matchmaking/types';
import MatchFinishedSection from '@/components/result/MatchFinishedSection';
import Link from 'next/link';
import Time from '@/components/commons/Time';
import React from 'react';
import Main from '@/components/commons/Main';

interface Props {
  params: Promise<{ match: string }>;
}
export default async function ResultsMatch(props: Props) {
  const params = await props.params;
  const cookieStore = await cookies();
  const match = await supabase(cookieStore)
    .getMatch(Number(params.match))
    .then(verifySingleResult);
  const { data: eventMatch } = await supabase(cookieStore).getEventMatch(match.id);

  const isFinished = match.status === MatchStatus.Finished;
  const isClosed = match.status === MatchStatus.Closed;
  const isOngoing =
    match.status === MatchStatus.Ongoing || match.status === MatchStatus.Scheduled;

  const breadcrumbs = eventMatch
    ? [
        { href: '/events', label: 'Events' },
        { href: `/events/${eventMatch.event.id}`, label: eventMatch.event.name },
      ]
    : [{ href: '/results', label: 'Results' }];

  return (
    <Main
      title={match.config.name}
      breadcrumbs={breadcrumbs}
      relevantRoles={['match_admin']}
    >
      <div className="mb-8">
        <p className="text-sm text-gray font-bold">
          <Time
            date={match.scheduled_at || match.closed_at || match.created_at}
            format="HH:mm - EEEE, MMMM d"
          />
          {` - Match ${match.id}`}
        </p>
      </div>
      {isFinished && <MatchFinishedSection match={match} />}
      {isClosed && <MatchResultSection match={match} />}
      {isOngoing && (
        <Link className="link" href={`/matches/${match.id}`}>
          Match is still ongoing
        </Link>
      )}
      {match.rounds.length > 0 && <div className="divider" />}
      <RoundsList
        rounds={[...match.rounds].sort((a, b) =>
          a.created_at.localeCompare(b.created_at)
        )}
      />
    </Main>
  );
}
