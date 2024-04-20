import { cookies } from 'next/headers';
import { assertString } from '@bf2-matchmaking/utils';
import { MatchesJoined } from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import SelectActionForm from '@/components/SelectActionForm';
import { addServer } from '@/app/matches/[match]/actions';

interface Props {
  match: MatchesJoined;
  defaultAddress?: string;
}

export default async function AddServerForm({ match, defaultAddress }: Props) {
  const { data: servers } = await supabase(cookies).getServers();
  const isMatchOfficer = await supabase(cookies).isMatchOfficer(match);

  if (!servers) {
    return null;
  }

  async function addMatchServerSA(data: FormData) {
    'use server';
    const value = data.get('select');
    assertString(value, 'No server selected');
    return addServer(match.id, value);
  }

  return (
    <SelectActionForm
      label="Add match server"
      options={servers.map(({ ip, name }) => [ip, name])}
      defaultValue={defaultAddress}
      placeholder={!defaultAddress ? 'Add Server' : undefined}
      action={addMatchServerSA}
      successMessage="Added server"
      errorMessage="Failed to add server"
      disabled={!isMatchOfficer}
    />
  );
}
