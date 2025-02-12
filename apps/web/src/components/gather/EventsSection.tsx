import EventList from '@/components/gather/EventList';
import { api, verify } from '@bf2-matchmaking/utils';

interface Props {
  config: number;
}

export default async function EventsSection({ config }: Props) {
  const events = await api.v2.getGatherEvents(config).then(verify);

  return (
    <section className="section mt-8">
      <h2>Gather events</h2>
      <code className="bg-base-300 p-4 rounded">
        <EventList defaultEvents={events} config={config} />
      </code>
    </section>
  );
}
