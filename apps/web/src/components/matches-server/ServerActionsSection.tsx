import { isDefined, MatchesJoined, MatchServer, Region } from '@bf2-matchmaking/types';
import SelectServerForm from '@/components/matches/SelectServerForm';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import GenerateServerForm from '@/components/matches-server/GenerateServerForm';
import TextField from '@/components/commons/TextField';
import { api } from '@bf2-matchmaking/utils';
import RegionsSelectForm from '@/components/matches-server/RegionsSelectForm';

interface Props {
  match: MatchesJoined;
  matchServer: MatchServer | null;
}

export default async function ServerActionsSection({ match, matchServer }: Props) {
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();
  const { data: regions } = await api.platform().getRegions();

  if (!adminRoles?.server_admin) {
    return null;
  }

  return (
    <section className="section gap-1">
      <h2>Server actions</h2>
      <div className="divider" />
      <section>
        <h3>{`Active server: ${matchServer?.active?.name || 'No match server set'}`}</h3>
        <SelectServerForm match={match} matchServer={matchServer} />
      </section>
    </section>
  );

  function getRegionCities() {
    const cities = matchServer?.locations
      .map((location) => regions?.find((region) => region.id === location)?.city)
      .filter(isDefined);
    return cities && cities.length > 0 ? cities.join(', ') : 'No locations set';
  }
}
