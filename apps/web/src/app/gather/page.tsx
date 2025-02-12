import { api, assertObj, verify } from '@bf2-matchmaking/utils';
import EventList from '@/components/gather/EventList';
import {
  getGatherConfig,
  getGatherQueue,
  getGatherState,
} from '@bf2-matchmaking/redis/gather';
import ServerSection from '@/components/gather/ServerSection';
import { Suspense } from 'react';

export default async function Page() {
  const events = await api.v2.getGatherEvents(20).then(verify);
  console.log('events');
  const gatherState = await getGatherState(20);
  console.log('state');
  const config = await getGatherConfig(20);
  console.log('config');
  assertObj(config, 'Missing gather config');
  const gatherPlayers = await getGatherQueue(20);
  console.log('players');
  return (
    <main className="main">
      <h1>{config.name}</h1>
      <p>
        Status: {gatherState.status} ({gatherPlayers.length}/{config.size})
      </p>
      <Suspense fallback={null}>
        <ServerSection address={gatherState.address} />
      </Suspense>
      <section className="section">
        <h2>Gather events</h2>
        <code className="bg-base-300 p-4 rounded">
          <EventList defaultEvents={events} config={20} />
        </code>
      </section>
    </main>
  );
}
