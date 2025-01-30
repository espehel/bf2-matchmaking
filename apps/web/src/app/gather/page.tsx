import { api, verify } from '@bf2-matchmaking/utils';
import EventList from '@/components/gather/EventList';

export default async function Page() {
  const events = await api.v2.getGatherEvents(20).then(verify);
  return (
    <main className="main">
      <section className="section">
        <h2>Gather events</h2>
        <code className="bg-base-300 p-4 rounded">
          <EventList defaultEvents={events} config={20} />
        </code>
      </section>
    </main>
  );
}
