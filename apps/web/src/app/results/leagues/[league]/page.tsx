import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import LeagueResultRow from '@/components/result/LeagueResultRow';
import { DateTime } from 'luxon';
import { groupBy } from '@bf2-matchmaking/utils';
import EditModeButton from '@/components/result/EditModeButton';
import { Fragment } from 'react';

interface Props {
  params: Promise<{ league: string }>;
  searchParams: Promise<{ edit?: string }>;
}
export default async function LeaguePage(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const cookieStore = await cookies();
  const config = await supabase(cookieStore)
    .getMatchConfigResults(Number(params.league))
    .then(verifySingleResult);
  const groupedByWeeks = groupBy(config.matches, (m) =>
    DateTime.fromISO(m.scheduled_at).weekNumber.toString()
  ).sort((a, b) => b[0].localeCompare(a[0]));
  return (
    <main className="main">
      <div className="flex justify-between items-end max-w-4xl mx-auto">
        <h1 className="text-accent font-bold">{config.name}</h1>
        <EditModeButton edit={searchParams.edit === 'true'} config={params.league} />
      </div>
      <div className="overflow-x-auto h-screen max-w-4xl mx-auto mt-4">
        <table className="table table-lg table-pin-rows bg-base-100 shadow-xl">
          {groupedByWeeks.map(([week, matches]) => (
            <Fragment key={week}>
              <thead>
                <tr className="bg-secondary text-secondary-content">
                  <th>{`Week ${week}`}</th>
                  <th>Team</th>
                  <th>Maps</th>
                  <th>Tickets</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(({ id, status, home_team, away_team, results }) => (
                  <LeagueResultRow
                    key={id}
                    matchId={id}
                    status={status}
                    homeTeam={home_team}
                    awayTeam={away_team}
                    results={results}
                  />
                ))}
              </tbody>
            </Fragment>
          ))}
        </table>
      </div>
    </main>
  );
}
