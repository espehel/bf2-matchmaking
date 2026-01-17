import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';
import MainOld from '@/components/commons/MainOld';
import CreateEventModal from '@/components/events/CreateEventModal';
import { ArrowRightIcon } from '@heroicons/react/16/solid';

const EVENT_TYPES = ['League', 'Cup'];
export default async function LeaguesPage() {
  const cookieStore = await cookies();
  const events = await supabase(cookieStore).getEvents().then(verifySingleResult);
  return (
    <MainOld title="Events" relevantRoles={['match_admin']}>
      <div className="max-w-3xl">
        <CreateEventModal />
        <ul className="menu menu-lg gap-4">
          {events.map((event) => (
            <li className="list-item" key={event.id}>
              <Link href={`/events/${event.id}`}>
                {event.name}
                <ArrowRightIcon className="size-8 ml-auto" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </MainOld>
  );
}
