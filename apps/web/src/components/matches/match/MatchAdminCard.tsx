import { Card } from '@/components/commons/card/Card';
import Time from '@/components/commons/Time';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/supabase-server';
import { MatchesJoined } from '@bf2-matchmaking/types';
import { api } from '@bf2-matchmaking/services/api';

interface Props {
  match: MatchesJoined;
}

export default async function MatchAdminCard({ match }: Props) {
  const cookieStore = await cookies();
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();

  if (!adminRoles?.match_admin && !adminRoles?.system_admin) {
    return null;
  }

  const { data: logs } = await api.getMatchLog(match.id);

  return (
    <Card title="Match Admin">
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="badge badge-lg">{match.status}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
        <span className="text-base-content/70">Created</span>
        <Time date={match.created_at} format="LLL dd, yyyy HH:mm" />
        {match.scheduled_at && (
          <>
            <span className="text-base-content/70">Scheduled</span>
            <Time date={match.scheduled_at} format="LLL dd, yyyy HH:mm" />
          </>
        )}
        {match.started_at && (
          <>
            <span className="text-base-content/70">Started</span>
            <Time date={match.started_at} format="LLL dd, yyyy HH:mm" />
          </>
        )}
        {match.closed_at && (
          <>
            <span className="text-base-content/70">Closed</span>
            <Time date={match.closed_at} format="LLL dd, yyyy HH:mm" />
          </>
        )}
      </div>
      {logs && logs.length > 0 && (
        <>
          <div className="divider divider-start">Match Log</div>
          <code className="bg-base-300 p-4 rounded overflow-y-scroll max-h-96">
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
        </>
      )}
    </Card>
  );
}
