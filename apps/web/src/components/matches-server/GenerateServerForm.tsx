import FormSubmitButton from '@/components/FormSubmitButton';
import { MatchesJoined } from '@bf2-matchmaking/types';
import React from 'react';
import ActionForm from '@/components/commons/ActionForm';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { api, createServerDnsName, createServerName } from '@bf2-matchmaking/utils';
import RegionSelect from '@/components/commons/RegionSelect';
import MapsSelect from '@/components/commons/MapsSelect';
import TextField from '@/components/commons/TextField';
import { generateMatchServer } from '@/app/matches/[match]/server/actions';

interface Props {
  match: MatchesJoined;
}
export default async function GenerateServerForm({ match }: Props) {
  const { data: maps } = await supabase(cookies).getMaps();
  const { data: regions } = await api.platform().getRegions();

  async function generateServerSA(data: FormData) {
    'use server';
    return generateMatchServer(match, data);
  }

  return (
    <ActionForm
      action={generateServerSA}
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
      </div>
      <FormSubmitButton>Generate new server</FormSubmitButton>
    </ActionForm>
  );
}
