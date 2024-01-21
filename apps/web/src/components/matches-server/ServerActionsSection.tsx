import { MatchesJoined, MatchServer } from '@bf2-matchmaking/types';
import SelectServerForm from '@/components/matches/SelectServerForm';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import GenerateServerForm from '@/components/servers/GenerateServerForm';

interface Props {
  match: MatchesJoined;
  matchServer: MatchServer | null;
}

export default async function ServerActionsSection({ match, matchServer }: Props) {
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();

  if (!adminRoles?.server_admin) {
    return null;
  }

  return (
    <section className="section gap-1">
      <h2>Server actions</h2>
      <GenerateServerForm match={match} />
      <div className="divider" />
      <SelectServerForm match={match} matchServer={matchServer} />
    </section>
  );
}
