import { api, verify } from '@bf2-matchmaking/utils';
import ServerSection from '@/components/gather/ServerSection';
import { Suspense } from 'react';
import EventsSection from '@/components/gather/EventsSection';
import PlayersSection from '@/components/gather/PlayersSection';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';

export default async function Page() {
  const cookieStore = await cookies();
  const config = await supabase(cookieStore).getMatchConfig(20).then(verifySingleResult);
  const { state, events, players } = await api.v2.getGather(config.id).then(verify);

  return (
    <main className="main">
      <h1>{config.name}</h1>
      <p>
        Status: {state.status} ({players.length}/{config.size})
      </p>
      <div className="flex gap-8  mt-8">
        <PlayersSection players={players} />
        <Suspense fallback={null}>
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
