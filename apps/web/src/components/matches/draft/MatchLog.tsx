import Time from '@/components/commons/Time';
import { api } from '@bf2-matchmaking/services/api';

interface Props {
  matchId: number;
}

export default async function MatchLog({ matchId }: Props) {
  const { data: logs } = await api.getMatchLog(matchId);
  if (!logs) {
    return null;
  }

  return (
    <section className="section max-h-96 w-full">
      <h2>Match events</h2>
      <code className="bg-base-300 p-4 rounded overflow-y-scroll">
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
