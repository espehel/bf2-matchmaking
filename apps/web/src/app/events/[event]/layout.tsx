import Main from '@/components/commons/Main';
import { ReactNode } from 'react';
import { supabase } from '@/lib/supabase/supabase-server';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import { cookies } from 'next/headers';
import EventNav from '@/components/events/EventNav';

interface Props {
  params: Promise<{ event: string }>;
  children: ReactNode;
}

export default async function EventLayout(props: Props) {
  const params = await props.params;
  const cookieStore = await cookies();
  const event = await supabase(cookieStore)
    .getEvent(Number(params.event))
    .then(verifySingleResult);

  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();
  return (
    <Main
      title={event.name}
      breadcrumbs={[{ href: '/events', label: 'Events' }, { label: event.name }]}
      relevantRoles={['match_admin']}
    >
      <EventNav event={params.event} isAdmin={adminRoles?.match_admin || false} />
      {props.children}
    </Main>
  );
}
