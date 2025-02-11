import { api, assertObj, verify } from '@bf2-matchmaking/utils';
import EventList from '@/components/gather/EventList';
import {
  getGatherConfig,
  getGatherQueue,
  getGatherState,
} from '@bf2-matchmaking/redis/gather';
import ServerSection from '@/components/gather/ServerSection';

export default async function Page() {
  const events = await api.v2.getGatherEvents(20).then(verify);
  const gatherState = await getGatherState(20);
  const config = await getGatherConfig(20);
  assertObj(config, 'Missing gather config');
  const gatherPlayers = await getGatherQueue(20);
  return (
    <main className="main">
      <h1>{config.name}</h1>
      <p>
        Status: {gatherState.status} ({gatherPlayers.length}/{config.size})
      </p>
      <ServerSection address={gatherState.address} />
      <section className="section">
        <h2>Gather events</h2>
        <code className="bg-base-300 p-4 rounded">
          <EventList defaultEvents={events} config={20} />
        </code>
      </section>
    </main>
  );
}
