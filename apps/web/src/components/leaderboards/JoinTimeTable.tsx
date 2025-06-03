import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { DateTime, Duration } from 'luxon';
import { isNotNull } from '@bf2-matchmaking/types';

interface Props {
  sortOrder?: string;
  sortField?: string;
  length?: string;
  concatHref: (newParams: { sortOrder?: string; length?: string }) => string;
}

export default async function JoinTimeTable({
  sortField,
  sortOrder,
  length,
  concatHref,
}: Props) {
  const cookieStore = await cookies();
  const { data: players } = await supabase(cookieStore).getPlayersWithJoinTime();
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();

  const withJoinTime =
    players
      ?.map((p) => {
        const connectedAt = p.match_players
          .map(({ connected_at, matches }) => {
            if (!connected_at || !matches?.started_at) {
              return null;
            }
            return DateTime.fromISO(connected_at).diff(
              DateTime.fromISO(matches.started_at),
              'milliseconds'
            ).milliseconds;
          })
          .filter(isNotNull);
        if (!connectedAt.length) {
          return null;
        }
        return [
          p.nick,
          connectedAt.reduce((acc, curr) => acc + curr, 0) / connectedAt.length,
        ];
      })
      .filter(isNotNull) || [];

  let sortedJointime =
    (withJoinTime as Array<[string, number]>)?.sort((a, b) => {
      if (sortOrder === 'desc' && adminRoles?.player_admin) {
        return b[1] - a[1];
      }
      return a[1] - b[1];
    }) || [];

  sortedJointime =
    length === 'full' && adminRoles?.player_admin
      ? sortedJointime
      : sortedJointime.slice(0, 10);

  return (
    <div>
      <table className="table table-lg">
        <thead>
          <tr>
            <th></th>
            <th>Nick</th>
            <th>
              <Link
                href={concatHref({ sortOrder: sortOrder === 'desc' ? 'asc' : 'desc' })}
              >
                Time
              </Link>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedJointime.map(([nick, time], i) => (
            <tr key={i}>
              <th>{i + 1}</th>
              <td>{nick}</td>
              <td>{Duration.fromMillis(time).toFormat(`m'm' ss's'`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {adminRoles?.player_admin && (
        <Link href={concatHref({ length: 'full' })}>See all</Link>
      )}
    </div>
  );
}
