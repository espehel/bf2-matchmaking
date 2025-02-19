import EventList from '@/components/gather/EventList';
import { api, verify } from '@bf2-matchmaking/utils';
import { StreamEventReply } from '@bf2-matchmaking/types/redis';

interface Props {
  config: number;
  events: Array<StreamEventReply>;
}

export default function EventsSection({ config, events }: Props) {
  return (
    <section className="section mt-8">
      <h2>Gather events</h2>
      <code className="bg-base-300 p-4 rounded">
        <EventList defaultEvents={events} config={config} />
      </code>
    </section>
  );
}
