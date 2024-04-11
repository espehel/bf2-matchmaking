import { api, verify } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { isDefined, isScheduledMatch, MatchConfigType } from '@bf2-matchmaking/types';
import Link from 'next/link';
import Time from '@/components/commons/Time';
import { wait } from '@bf2-matchmaking/utils/src/async-actions';

interface Props {
  searchParams: { month?: string; year?: string };
}
export default async function Page({ searchParams }: Props) {
  const servers = await api.live().getServers().then(verify);

  const startOfMonth = DateTime.fromObject({
    year: searchParams.year ? Number(searchParams.year) : undefined,
    month: searchParams.month ? Number(searchParams.month) : undefined,
    day: 1,
  });

  const matches = await supabase(cookies)
    .getMatchServerSchedule(startOfMonth.toISO(), startOfMonth.endOf('month').toISO())
    .then(verifyResult);

  const daysInMonth = startOfMonth.daysInMonth || 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = days.map((day) =>
    DateTime.fromObject({
      year: startOfMonth.year,
      month: startOfMonth.month,
      day,
    }).toFormat('EEE')
  );

  const prevMonth = startOfMonth.minus({ month: 1 });
  const nextMonth = startOfMonth.plus({ month: 1 });

  const schedule = matches
    .map(({ id, scheduled_at, config, servers }) => {
      if (!scheduled_at) {
        return [];
      }
      return servers.map(({ ip }) => ({
        id,
        ip,
        type: config.type,
        day: DateTime.fromISO(scheduled_at).day,
        date: scheduled_at,
      }));
    })
    .flat();

  return (
    <main className="main">
      <h1>Server schedule</h1>
      <div className="mt-2 border border-primary rounded p-4 bg-base-100">
        <div className="overflow-x-auto">
          <table className="table table-zebra table-pin-rows table-pin-cols">
            <thead>
              <tr>
                <th>Server</th>
                {days.map((day, i) => {
                  const weekDay = weekDays[i];
                  return (
                    <td key={day} className={getBorderStyle(i)}>
                      <div className="inline-flex flex-col items-center justify-center">
                        <div>{weekDay}</div>
                        <div>{day}</div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {servers.map((server) => (
                <tr key={server.address} className="hover">
                  <th className="truncate">{server.info.serverName}</th>
                  {days.map((day, i) => {
                    const match = schedule.find(
                      (m) => m.ip === server.address && m.day === day
                    );
                    return (
                      <td
                        key={day}
                        className={`h-4 w-6 p-1 ${getCellStyle(
                          match?.type
                        )} ${getBorderStyle(i)}`}
                      >
                        {match ? (
                          <Link href={`/matches/${match?.id}`}>
                            <Time date={match.date} format="HH:mm" />
                          </Link>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-2">
          <div className="join grid grid-cols-3">
            <Link
              href={`/servers/calendar?month=${prevMonth.month}&year=${prevMonth.year}`}
              className="btn btn-outline join-item"
            >
              <ChevronLeftIcon className="size-4" />
              {prevMonth.monthLong}
            </Link>
            <div className="join-item btn btn-outline btn-active">
              {startOfMonth.monthLong}
            </div>
            <Link
              href={`/servers/calendar?month=${nextMonth.month}&year=${nextMonth.year}`}
              className="btn btn-outline join-item"
            >
              {nextMonth.monthLong}
              <ChevronRightIcon className="size-4" />
            </Link>
          </div>
          <div className="flex gap-2">
            <div className="badge badge-info">Mix</div>
            <div className="badge badge-success">PCW</div>
            <div className="badge badge-secondary">Ladder</div>
            <div className="badge badge-accent">Cup</div>
          </div>
        </div>
      </div>
    </main>
  );

  function getBorderStyle(index: number) {
    return weekDays[index] === 'Sun' ? 'border-r border-primary' : '';
  }
}

function getCellStyle(matchType: MatchConfigType | undefined) {
  switch (matchType) {
    case 'Mix':
      return 'bg-info text-info-content';
    case 'PCW':
      return 'bg-success text-success-content';
    case 'Ladder':
      return 'bg-secondary text-secondary-content';
    case 'Cup':
      return 'bg-accent text-accent-content';
  }
  return '';
}
