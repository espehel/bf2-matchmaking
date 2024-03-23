import { api, verify } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/16/solid';

interface Props {
  searchParams: { month?: string; year?: string };
}
export default async function Page({ searchParams }: Props) {
  const servers = await api.live().getServers().then(verify);

  const today = DateTime.now();
  const daysInMonth = today.daysInMonth || 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const prevMonth = today.minus({ month: 1 });
  const nextMonth = today.plus({ month: 1 });

  return (
    <main className="main">
      <h1>Server schedule</h1>
      <div className="mt-2 border border-primary rounded p-4 bg-base-100">
        <div className="overflow-x-auto">
          <table className="table table-zebra table-pin-rows table-pin-cols">
            <thead>
              <tr>
                <th className="">Server</th>
                {days.map((day) => (
                  <td key={day}>{day}</td>
                ))}
              </tr>
            </thead>
            <tbody className="">
              {servers.map((server) => (
                <tr key={server.address} className="hover">
                  <th className="truncate">{server.info.serverName}</th>
                  {days.map((day) => (
                    <td key={day}>X</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-2">
          <div className="join grid grid-cols-3">
            <button className="btn btn-outline join-item">
              <ChevronLeftIcon className="size-4" />
              {prevMonth.monthLong}
            </button>
            <div className="join-item btn btn-outline btn-active">{today.monthLong}</div>
            <button className="btn btn-outline join-item">
              {nextMonth.monthLong}
              <ChevronRightIcon className="size-4" />
            </button>
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
}
