import Time from '@/components/commons/Time';
import { isStatusChange } from '@bf2-matchmaking/types';
import { api, verify } from '@bf2-matchmaking/utils';

export default async function Page() {
  const events = await api.v2.getGatherEvents(20).then(verify);
  return (
    <main className="main">
      <section className="section">
        <h2>Gather events</h2>
        <code className="bg-base-300 p-4 rounded">
          <ul>
            {events.map((entry) => (
              <li key={entry.id}>
                <span className="mr-1">
                  <Time date={entry.message.timestamp} format="LLL dd TT" />
                </span>
                <span className="mr-1 text-accent">{entry.message.event}</span>
                <span className="text-info">{getText(entry.message.payload)}</span>
              </li>
            ))}
          </ul>
        </code>
      </section>
    </main>
  );
}

function getText(payload: unknown) {
  if (isStatusChange(payload)) {
    return `Status change: ${payload.prevStatus} -> ${payload.status}`;
  }
  return '';
}
