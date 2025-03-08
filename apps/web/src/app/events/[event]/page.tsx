import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import AddRoundForm from '@/components/events/AddRoundForm';
import EventRound from '@/components/events/EventRound';
import TeamsSection from '@/components/events/TeamsSection';
import Link from 'next/link';
import Main from '@/components/commons/Main';

interface Props {
  params: { event: string };
  searchParams: { edit?: string };
}

export default async function EventPage({ params, searchParams }: Props) {
  const event = await supabase(cookies)
    .getEvent(Number(params.event))
    .then(verifySingleResult);
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();

  const edit = adminRoles?.match_admin ? searchParams.edit === 'true' : false;

  return (
    <Main
      title={event.name}
      breadcrumbs={[{ href: '/events', label: 'Events' }, { label: event.name }]}
      relevantRoles={['match_admin']}
    >
      <div className="flex justify-between items-end">
        <Link
          className="btn btn-sm btn-secondary ml-auto"
          href={edit ? `/events/${event.id}` : `/events/${event.id}?edit=true`}
        >
          {edit ? 'Back' : 'Edit'}
        </Link>
      </div>
      <div className="flex gap-6 w-full mt-6">
        <section className="section gap-6 grow">
          <h2>Rounds</h2>
          <ul>
            {event.rounds.map((round) => (
              <li key={round.id} className="mb-4">
                <EventRound event={event} round={round} edit={edit} />
              </li>
            ))}
          </ul>
          {edit && <AddRoundForm eventId={event.id} />}
        </section>
        <TeamsSection event={event} edit={edit} />
      </div>
    </Main>
  );
}
