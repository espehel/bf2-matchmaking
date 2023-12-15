import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';

const EVENT_TYPES = ['League', 'Cup'];
export default async function LeaguesPage() {
  const events = await supabase(cookies).getEvents().then(verifySingleResult);
  return (
    <main className="main">
      <h1>Events</h1>
      <ul className="menu menu-lg">
        {events.map((event) => (
          <li className="border-2 border-primary rounded" key={event.id}>
            <Link href={`/events/${event.id}`}>{event.name}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
