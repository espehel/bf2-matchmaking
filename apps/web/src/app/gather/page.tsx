import { verify } from '@bf2-matchmaking/utils';
import { api } from '@bf2-matchmaking/services/api';
import ServerSection from '@/components/gather/ServerSection';
import { Suspense } from 'react';
import EventsSection from '@/components/gather/EventsSection';
import PlayersSection from '@/components/gather/PlayersSection';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import ConnectionsSection from '@/components/gather/ConnectionsSection';
import SectionFallback from '@/components/commons/SectionFallback';
import { GatherStatus } from '@bf2-matchmaking/types/gather';

const GATHER_CONFIG = 20;

const statusBadgeClass: Record<GatherStatus, string> = {
  [GatherStatus.Queueing]: 'badge-info',
  [GatherStatus.Summoning]: 'badge-warning',
  [GatherStatus.Starting]: 'badge-success',
  [GatherStatus.Aborting]: 'badge-error',
  [GatherStatus.Failed]: 'badge-error',
};

interface Props {
  searchParams: Promise<{ auto?: string }>;
}

export default async function Page(props: Props) {
  const searchParams = await props.searchParams;
  const cookieStore = await cookies();
  const config = await supabase(cookieStore)
    .getMatchConfig(GATHER_CONFIG)
    .then(verifySingleResult);
  const { state, events, players } = await api.getGather(config.id).then(verify);

  return (
    <main className="main">
      <h1>{config.name}</h1>
      <div className="flex items-center gap-3">
        <span className={`badge badge-lg ${statusBadgeClass[state.status]}`}>
          {state.status}
        </span>
        <span className="text-sm text-base-content/60">
          {players.length}/{config.size} players
        </span>
      </div>
      <div className="flex gap-8  mt-8">
        <Suspense fallback={<SectionFallback title="Connections" />}>
          <ConnectionsSection config={config} serverAddress={state.address} players={players} />
        </Suspense>
        <PlayersSection players={players} />
        <Suspense fallback={<SectionFallback title="No server selected" />}>
          <ServerSection
            address={state.address}
            configId={config.id}
            gatherStatus={state.status}
          />
        </Suspense>
      </div>
      <EventsSection config={config.id} events={events} />
    </main>
  );
}
