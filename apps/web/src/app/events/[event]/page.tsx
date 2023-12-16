import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import AddTeamForm from '@/components/events/AddTeamForm';
import AddRoundForm from '@/components/events/AddRoundForm';
import EventRound from '@/components/events/EventRound';
import TeamsSection from '@/components/events/TeamsSection';

interface Props {
  params: { event: string };
}

export default async function EventPage({ params }: Props) {
  const event = await supabase(cookies)
    .getEvent(Number(params.event))
    .then(verifySingleResult);

  return (
    <main className="main">
      <h1>{event.name}</h1>
      <div className="flex justify-around w-full">
        <section className="section gap-6">
          <h2>Rounds</h2>
          <ul>
            {event.rounds.map((round) => (
              <li key={round.id} className="mb-4">
                <EventRound event={event} round={round} />
              </li>
            ))}
          </ul>
          <AddRoundForm eventId={event.id} />
        </section>
        <TeamsSection event={event} />
      </div>
    </main>
  );
}
