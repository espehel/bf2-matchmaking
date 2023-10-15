import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import MatchSection from '@/components/match/MatchSection';
import ServerSection from '@/components/match/ServerSection';
import LiveSection from '@/components/match/LiveSection';
import RoundsList from '@/components/RoundsList';
import moment from 'moment/moment';
import { api } from '@bf2-matchmaking/utils';
import { Suspense } from 'react';
import { useMatch } from '@/state/MatchContext';
import ServerSectionLoading from '@/components/match/ServerSectionLoading';
import MapsSection from '@/components/match/MapsSection';
import ScheduledAt from '@/components/match/ScheduledAt';

interface Props {
  params: { match: string };
}
export default async function ResultsMatch({ params }: Props) {
  const match = await supabase(cookies)
    .getMatch(parseInt(params.match))
    .then(verifySingleResult);

  const { data: adminRoles } = await supabase(cookies).getAdminRoles();
  const { data: sessionPlayer } = await supabase(cookies).getSessionPlayer();
  const { data } = await api.rcon().getMatchLive(match.id);

  const isMatchPlayer = match.players.some((p) => p.id === sessionPlayer?.id);

  return (
    <main className="main flex flex-col items-center text-center">
      <div className="mb-8">
        <h1 className="text-accent font-bold">{`${match.config.name}`}</h1>
        <ScheduledAt match={match} />
      </div>
      <div className="flex flex-wrap gap-8 justify-center w-full">
        <MatchSection match={match} isMatchAdmin={Boolean(adminRoles?.match_admin)} />
        <Suspense fallback={<ServerSectionLoading match={match} />}>
          <ServerSection
            match={match}
            isMatchAdmin={Boolean(adminRoles?.match_admin)}
            isMatchPlayer={isMatchPlayer}
          />
        </Suspense>
        <MapsSection match={match} key={match.maps.map((m) => m.id).join()} />
        <LiveSection
          data={data}
          match={match}
          isMatchAdmin={Boolean(adminRoles?.match_admin)}
        />
        <div className="divider" />
        <RoundsList
          rounds={[...match.rounds].sort((a, b) =>
            a.created_at.localeCompare(b.created_at)
          )}
        />
      </div>
    </main>
  );
}
