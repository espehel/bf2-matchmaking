import { events } from '@/lib/supabase/supabase-server';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import EventRound from '@/components/events/EventRound';
import Link from 'next/link';
import AddTeamForm from '@/components/events/AddTeamForm';

interface Props {
  params: Promise<{ event: string }>;
  searchParams: Promise<{ edit?: string }>;
}

export default async function EventPage(props: Props) {
  const params = await props.params;
  const event = await events.get(Number(params.event)).then(verifySingleResult);

  return (
    <div className="flex gap-6 w-full mt-2">
      <section className="section gap-6 grow">
        <ul>
          {event.rounds.map((round) => (
            <li key={round.id} className="mb-6">
              <EventRound event={event} round={round} edit={false} />
            </li>
          ))}
        </ul>
      </section>
      <section className="section gap-2">
        <ul>
          {event.teams.map((team) => (
            <li className="flex items-center gap-1 text-lg" key={team.id}>
              <Link className="link link-hover" href={`/teams/${team.id}`}>
                {team.name}
              </Link>
            </li>
          ))}
        </ul>
        <AddTeamForm eventId={event.id} edit={false} open={event.open} />
      </section>
    </div>
  );
}
