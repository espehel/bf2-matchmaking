import { events } from '@/lib/supabase/supabase-server';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import { resultsService } from '@/lib/services';

interface Props {
  params: Promise<{ event: string }>;
}

export default async function EventPage(props: Props) {
  const params = await props.params;
  const event = await events.get(Number(params.event)).then(verifySingleResult);

  const standings = await resultsService.getStandings(event.id);
  const standingsEntries = Object.entries(standings);

  return (
    <div className="flex gap-6 w-full mt-2">
      <section className="section gap-6 grow">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th></th>
                <td>Team</td>
                <td>Points</td>
                <td>Tickets</td>
                <td>Difference</td>
                <td>Matches Played</td>
              </tr>
            </thead>
            <tbody>
              {standingsEntries.map(
                ([team, { name, points, tickets, ticketsDiff, matchesPlayed }], i) => (
                  <tr key={team}>
                    <td>{i + 1}</td>
                    <td>{name}</td>
                    <td>{points}</td>
                    <td>{tickets}</td>
                    <td>{ticketsDiff}</td>
                    <td>{matchesPlayed}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
