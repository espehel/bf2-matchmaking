import { cookies } from 'next/headers';
import { assertString } from '@bf2-matchmaking/utils';
import { MatchesJoined, MatchServer } from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import SelectActionForm from '@/components/SelectActionForm';
import { setServer } from '@/app/matches/[match]/actions';

interface Props {
  match: MatchesJoined;
  matchServer: MatchServer | null;
}

export default async function SelectServerForm({ match, matchServer }: Props) {
  const { data: servers } = await supabase(cookies).getServers();
  const isMatchOfficer = await supabase(cookies).isMatchOfficer(match);

  if (!servers) {
    return null;
  }

  async function setMatchServerSA(data: FormData) {
    'use server';
    const value = data.get('select');
    assertString(value, 'No server selected');
    return setServer(match.id, value);
  }

  return (
    <SelectActionForm
      label="Set match server"
      options={servers.map(({ ip, name }) => [ip, name])}
      defaultValue={matchServer?.server?.ip}
      placeholder={!matchServer?.server?.ip ? 'Select Server' : undefined}
      action={setMatchServerSA}
      successMessage="Changed server"
      errorMessage="Failed to set server"
      disabled={!isMatchOfficer}
    />
  );
}
