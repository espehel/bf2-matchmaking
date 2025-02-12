import { assertObj } from '@bf2-matchmaking/utils';
import {
  getGatherConfig,
  getGatherQueue,
  getGatherState,
} from '@bf2-matchmaking/redis/gather';
import ServerSection from '@/components/gather/ServerSection';
import { Suspense } from 'react';
import EventsSection from '@/components/gather/EventsSection';

export default async function Page() {
  const config = await getGatherConfig(20);
  assertObj(config, 'Missing gather config');
  const gatherState = await getGatherState(config.id);
  const gatherPlayers = await getGatherQueue(config.id);

  return (
    <main className="main">
      <h1>{config.name}</h1>
      <p>
        Status: {gatherState.status} ({gatherPlayers.length}/{config.size})
      </p>
      <Suspense fallback={null}>
        <ServerSection address={gatherState.address} />
      </Suspense>
      <Suspense fallback={null}>
        <EventsSection config={config.id} />
      </Suspense>
    </main>
  );
}
