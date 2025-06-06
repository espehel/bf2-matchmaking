import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { createScheduledMatch } from '@/app/matches/actions';
import React from 'react';
import ActionFormModal from '@/components/commons/ActionFormModal';
import ServerMultiSelect from '@/components/form/ServerMultiSelect';
import MapMultiSelect from '@/components/form/MapMultiSelect';
import { DiscordMessageInput } from '@/components/matches/schedule/DiscordMessageInput';

export default async function CreateMatchFromDiscordForm() {
  const cookieStore = await cookies();
  const servers = await supabase(cookieStore).getServers().then(verifyResult);
  const maps = await supabase(cookieStore).getMaps().then(verifyResult);

  return (
    <ActionFormModal
      title="Create discord match"
      openBtnLabel="Create discord match"
      openBtnKind="btn-secondary"
      openBtnSize="btn-lg"
      action={createScheduledMatch}
      successMessage="Match scheduled."
      errorMessage="Failed to create match"
      className="flex flex-col gap-4"
    >
      <DiscordMessageInput />
      <div className="fieldset">
        <legend className="fieldset-legend">Override message</legend>
        <ServerMultiSelect servers={servers} />
        <MapMultiSelect maps={maps} />
      </div>
    </ActionFormModal>
  );
}

function filterVisible<T extends { visible: boolean }>(array: Array<T>): Array<T> {
  return array.filter((e) => e.visible);
}

function sortByName<T extends { name: string }>(array: Array<T>): Array<T> {
  return [...array].sort((a, b) => a.name.localeCompare(b.name));
}
