import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import MatchSection from '@/components/matches/MatchSection';
import MatchServerSection from '@/components/matches/server/MatchServerSection';
import LiveSection from '@/components/matches/LiveSection';
import RoundsList from '@/components/RoundsList';
import { Suspense } from 'react';
import ServerSectionLoading from '@/components/matches/server/ServerSectionLoading';
import MatchTimeForm, { MatchTimeFallback } from '@/components/matches/MatchTimeForm';
import { isActiveMatch } from '@bf2-matchmaking/utils';
import ChallengeSection from '@/components/matches/ChallengeSection';
import Main from '@/components/commons/Main';
import { Metadata, ResolvingMetadata } from 'next/types';

interface Props {
  params: Promise<{ match: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const matchId = (await params).match;

  const cookieStore = await cookies();
  const match = await supabase(cookieStore)
    .getMatch(Number(matchId))
    .then(verifySingleResult);
  const { data: eventMatch } = await supabase(cookieStore).getEventMatch(match.id);
  const title = `${match.config.type} Match ${match.id}`;
  const description =
    match.config.type === 'Mix'
      ? match.config.name
      : `${eventMatch?.event.name || match.config.name}: ${match.home_team.name} v ${match.away_team.name}`;
  return {
    title,
    description,
  };
}

export default async function ResultsMatch(props: Props) {
  const params = await props.params;
  const cookieStore = await cookies();
  const match = await supabase(cookieStore)
    .getMatch(Number(params.match))
    .then(verifySingleResult);
  const { data: eventMatch } = await supabase(cookieStore).getEventMatch(match.id);

  //TODO: add server restart to match server view
  const breadcrumbs = eventMatch
    ? [
        { href: '/events', label: 'Events' },
        { href: `/events/${eventMatch.event.id}`, label: eventMatch.event.name },
      ]
    : [{ href: '/matches', label: 'Matches' }];
  return (
    <Main
      title={match.config.name}
      breadcrumbs={breadcrumbs}
      relevantRoles={['match_admin']}
    >
      <div className="mb-4">
        <Suspense fallback={<MatchTimeFallback match={match} />}>
          <MatchTimeForm match={match} eventMatch={eventMatch} />
        </Suspense>
      </div>
      <div className="flex flex-wrap gap-8 w-full p-4">
        <MatchSection match={match} />
        <div className="flex flex-col gap-2">
          {match.config.type === 'Ladder' && <ChallengeSection match={match} />}
          {isActiveMatch(match) && (
            <Suspense fallback={<ServerSectionLoading />}>
              <MatchServerSection match={match} />
            </Suspense>
          )}
        </div>
        {/*<MapsSection match={match} key={match.maps.map((m) => m.id).join()} />*/}
        <Suspense fallback={null}>
          <LiveSection match={match} />
        </Suspense>
        <div className="divider" />
        <RoundsList
          rounds={[...match.rounds].sort((a, b) =>
            a.created_at.localeCompare(b.created_at)
          )}
        />
      </div>
    </Main>
  );
}
