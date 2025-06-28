import FormSubmitButton from '@/components/FormSubmitButton';
import { MatchesJoined } from '@bf2-matchmaking/types';
import React from 'react';
import ActionForm from '@/components/form/ActionForm';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import {
  api,
  assertString,
  createServerDnsName,
  createServerName,
  getInitialServerMap,
} from '@bf2-matchmaking/utils';
import RegionSelect from '@/components/commons/RegionSelect';
import MapsSelect from '@/components/commons/MapsSelect';
import TextField from '@/components/commons/TextField';
import { generateMatchServer } from '@/app/matches/[match]/server/actions';

interface Props {
  match: MatchesJoined;
  hasInstance: boolean;
}
export default async function GenerateServerForm({ match, hasInstance }: Props) {
  const cookieStore = await cookies();
  const isMatchOfficer = await supabase(cookieStore).isMatchOfficer(match);
  const isMatchPlayer = await supabase(cookieStore).isMatchPlayer(match);
  const { data: maps } = await supabase(cookieStore).getMaps();
  const { data: regions } = await api.platform().getRegions();

  async function generateServerSA(data: FormData) {
    'use server';
    const { nameInput, domainInput, mapInput, regionInput } = Object.fromEntries(data);
    assertString(nameInput);
    assertString(domainInput);
    assertString(regionInput);
    assertString(mapInput);

    const map = getInitialServerMap(mapInput);

    return generateMatchServer(match, {
      name: nameInput,
      region: regionInput,
      map,
      subDomain: domainInput,
    });
  }

  async function generateQuickServerSA(data: FormData) {
    'use server';
    const region = data.get('regionInput');
    assertString(region);

    const { data: instances } = await api.platform().getServers(match.id);
    if (instances?.length) {
      return {
        data: null,
        error: { message: 'Server already created' },
      };
    }

    return generateMatchServer(match, {
      name: createServerName(match),
      region,
      subDomain: createServerDnsName(match.id),
    });
  }

  if (isMatchOfficer) {
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
  if (isMatchPlayer && !hasInstance) {
    return (
      <ActionForm
        action={generateQuickServerSA}
        successMessage="New server is starting up"
        errorMessage="Failed to generate server"
      >
        <div className="flex items-end gap-2">
          <RegionSelect regions={regions || []} />
          <FormSubmitButton>Generate new server</FormSubmitButton>
        </div>
      </ActionForm>
    );
  }
}
