import { MatchesJoined, MatchServer } from '@bf2-matchmaking/types';
import SelectServerForm from '@/components/matches/SelectServerForm';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import GenerateServerForm from '@/components/servers/GenerateServerForm';
import { api } from '@bf2-matchmaking/utils';

interface Props {
  match: MatchesJoined;
  matchServer: MatchServer | null;
}

export default async function SetServerSection({ match, matchServer }: Props) {
  const { data: servers } = await supabase(cookies).getServers();
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();
  const { data: regions } = await api.platform().getLocations();

  if (!adminRoles?.server_admin) {
    return null;
  }

  return (
    <section className="section">
      {servers && (
        <SelectServerForm match={match} matchServer={matchServer} servers={servers} />
      )}
      {regions && <GenerateServerForm regions={regions} />}
    </section>
  );
}
