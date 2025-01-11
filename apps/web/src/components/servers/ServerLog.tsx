import { api } from '@bf2-matchmaking/utils';
import Time from '@/components/commons/Time';

interface Props {
  address: string;
}

export default async function ServerLog({ address }: Props) {
  const { data: logs } = await api.v2.getServerLog(address);

  if (!logs) {
    return null;
  }

  return (
    <section className="section">
      <h2>Server log</h2>
      <code className="bg-base-300 p-4 rounded">
        <ul>
          {logs.map((entry) => (
            <li key={entry.timestamp}>
              <span className="mr-1">
                <Time date={Number(entry.timestamp)} format="LLL dd TT" />
              </span>
              <span className={`text-${entry.level}`}>{entry.message}</span>
            </li>
          ))}
        </ul>
      </code>
    </section>
  );
}
