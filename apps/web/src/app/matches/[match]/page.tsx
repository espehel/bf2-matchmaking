import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import MatchTeamsCard from '@/components/matches/match/MatchTeamsCard';
import { Suspense } from 'react';
import MatchTimeForm, { MatchTimeFallback } from '@/components/matches/MatchTimeForm';
import { Metadata } from 'next/types';
import Main from '@/components/commons/Main';
import { LiveServerCard } from '@/components/matches/match/LiveServerCard';
import MatchAdminCard from '@/components/matches/match/MatchAdminCard';

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

export default async function MatchPage(props: Props) {
  const params = await props.params;
  const cookieStore = await cookies();
  const match = await supabase(cookieStore)
    .getMatch(Number(params.match))
    .then(verifySingleResult);
  const { data: eventMatch } = await supabase(cookieStore).getEventMatch(match.id);

  return (
    <Main
      header={
        <div className="flex items-start mb-6 w-full">
          <h1 className="text-2xl font-bold m-0">{match.config.name}</h1>
          <div className="divider-primary divider divider-horizontal" />
          <Suspense fallback={<MatchTimeFallback match={match} />}>
            <MatchTimeForm match={match} eventMatch={eventMatch} />
          </Suspense>
        </div>
      }
      className="space-y-8"
    >
      <MatchTeamsCard match={match} />
      <LiveServerCard match={match} />
      <MatchAdminCard match={match} />
    </Main>
  );
}
