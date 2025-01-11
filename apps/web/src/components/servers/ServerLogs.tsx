import { api } from '@bf2-matchmaking/utils';
import Time from '@/components/commons/Time';

export default async function ServerLogs() {
  const { data: logs } = await api.v2.getServersLogs();

  if (!logs) {
    return null;
  }

  const flattenedLogs = logs
    .flatMap(([address, entries]) =>
      entries.map((entry) => ({ ...entry, address, timestamp: Number(entry.timestamp) }))
    )
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <section className="section">
      <h2>Server logs</h2>
      <code className="bg-base-300 p-4 rounded">
        <ul>
          {flattenedLogs.map((entry) => (
            <li key={entry.timestamp}>
              <span className="mr-1">
                <Time date={entry.timestamp} format="LLL dd TT" />
              </span>
              <span className="mr-1 text-accent">{entry.address}</span>
              <span className={`text-${entry.level}`}>{entry.message}</span>
            </li>
          ))}
        </ul>
      </code>
    </section>
  );
}
