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

export default async function SelectServerForm({ match, defaultAddress }: Props) {
  const { data: servers } = await supabase(cookies).getServers();
  const isMatchOfficer = await supabase(cookies).isMatchOfficer(match);

  if (!servers) {
    return null;
  }

  async function setMatchServerSA(data: FormData) {
    'use server';
    const value = data.get('select');
    assertString(value, 'No server selected');
    return addServer(match.id, value);
  }

  return (
    <SelectActionForm
      label="Set match server"
      options={servers.map(({ ip, name }) => [ip, name])}
      defaultValue={defaultAddress}
      placeholder={!defaultAddress ? 'Select Server' : undefined}
      action={setMatchServerSA}
      successMessage="Changed server"
      errorMessage="Failed to set server"
      disabled={!isMatchOfficer}
    />
  );
}
