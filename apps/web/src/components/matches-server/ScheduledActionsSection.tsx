import {
  isDefined,
  MatchesJoined,
  MatchServer,
  ScheduledMatch,
} from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { api } from '@bf2-matchmaking/utils';
import RegionsSelectForm from '@/components/matches-server/RegionsSelectForm';
import { DateTime } from 'luxon';

interface Props {
  match: ScheduledMatch;
  matchServer: MatchServer | null;
}

export default async function ScheduledActionsSection({ match, matchServer }: Props) {
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();
  const { data: regions } = await api.platform().getLocations();

  if (!adminRoles?.server_admin) {
    return null;
  }
  if (!regions) {
    return null;
  }

  return (
    <section className="section gap-1">
      <h2>Scheduled actions</h2>
      <p>
        <span>Servers will automatically be generated at </span>
        <span className="font-bold">
          {DateTime.fromISO(match.scheduled_at)
            .minus({ minutes: 15 })
            .toLocaleString(DateTime.TIME_24_SIMPLE)}
        </span>
        <span> in the following locations: </span>
        <span className="font-bold">{getRegionCities()}</span>
      </p>
      <RegionsSelectForm
        regions={regions}
        matchId={match.id}
        locations={matchServer?.locations}
      />
    </section>
  );

  function getRegionCities() {
    const cities = matchServer?.locations
      .map((location) => regions?.find((region) => region.id === location)?.city)
      .filter(isDefined);
    return cities && cities.length > 0 ? cities.join(', ') : 'No locations set';
  }
}
