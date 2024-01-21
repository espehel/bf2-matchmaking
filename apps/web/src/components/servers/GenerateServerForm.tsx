import FormSubmitButton from '@/components/FormSubmitButton';
import { generateServer } from '@/app/servers/actions';
import { MatchesJoined } from '@bf2-matchmaking/types';
import React from 'react';
import ActionForm from '@/components/commons/ActionForm';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import {
  api,
  createServerDnsName,
  createServerName,
  getServerVehicles,
} from '@bf2-matchmaking/utils';
import RegionSelect from '@/components/commons/RegionSelect';
import MapsSelect from '@/components/commons/MapsSelect';
import TextField from '@/components/commons/TextField';

interface Props {
  match: MatchesJoined;
}
export default async function GenerateServerForm({ match }: Props) {
  const { data: maps } = await supabase(cookies).getMaps();
  const { data: regions } = await api.platform().getLocations();

  return (
    <ActionForm
      action={generateServer}
      successMessage="New server is starting up"
      errorMessage="Failed to generate server"
    >
      <div className="grid grid-cols-2 gap-4 mb-4">
        <TextField
          name="nameInput"
          label="Server name"
          defaultValue={createServerName(match)}
          className="min-w-72"
        />
        <TextField
          name="domainInput"
          label="Sub domain"
          defaultValue={createServerDnsName(match.id)}
        />
        <RegionSelect regions={regions || []} />
        <MapsSelect maps={maps || []} optionKey="name" />
        <input className="hidden" readOnly value={match.id} name="matchId" />
        <input
          className="hidden"
          readOnly
          value={getServerVehicles(match)}
          name="vehicles"
        />
      </div>
      <FormSubmitButton>Generate new server</FormSubmitButton>
    </ActionForm>
  );
}
