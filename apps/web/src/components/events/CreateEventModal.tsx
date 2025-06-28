import ActionFormModal from '@/components/commons/ActionFormModal';
import React from 'react';
import Select from '@/components/commons/Select';
import { createEvent } from '@/app/events/actions';
import TextField from '@/components/commons/TextField';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';

export default async function CreateEventModal() {
  const cookieStore = await cookies();
  const player = await supabase(cookieStore).getSessionPlayerOrThrow();
  const configs = await supabase(cookieStore)
    .getMatchConfigsWithType('Cup')
    .then(verifyResult);
  return (
    <div className="ml-auto w-fit">
      <ActionFormModal
        title="Create event"
        openBtnLabel="Create event"
        action={createEvent}
        errorMessage="Something went wrong"
        successMessage="Event created"
        extras={{ player: player.id }}
      >
        <Select
          label="Match type"
          name="config"
          options={configs.map((c) => [c.id, c.name])}
        />
        <TextField name="name" label="Event name" />
      </ActionFormModal>
    </div>
  );
}
