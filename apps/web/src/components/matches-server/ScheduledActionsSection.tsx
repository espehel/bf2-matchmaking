import { isDefined, MatchServer, ScheduledMatch } from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { api, assertObj } from '@bf2-matchmaking/utils';
import RegionsSelectForm from '@/components/matches-server/RegionsSelectForm';
import { DateTime } from 'luxon';
import ActionButton from '@/components/ActionButton';
import { generateMatchServers } from '@/app/matches/[match]/server/actions';

interface Props {
  match: ScheduledMatch;
  matchServer: MatchServer | null;
}

export default async function ScheduledActionsSection({ match, matchServer }: Props) {
  const isMatchOfficer = await supabase(cookies).isMatchOfficer(match);
  const { data: regions } = await api.platform().getRegions();
  if (!isMatchOfficer) {
    return null;
  }
  if (!regions) {
    return null;
  }
  async function generateMatchServerInstanceSA() {
    'use server';
    assertObj(matchServer);
    return generateMatchServers(match, matchServer);
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
      <ActionButton
        action={generateMatchServerInstanceSA}
        successMessage="Generating servers"
        errorMessage="Failed to generate servers"
        kind="btn-secondary"
        disabled={!matchServer?.locations.length}
      >
        Generate servers now
      </ActionButton>
    </section>
  );

  function getRegionCities() {
    const cities = matchServer?.locations
      .map((location) => regions?.find((region) => region.id === location)?.city)
      .filter(isDefined);
    return cities && cities.length > 0 ? cities.join(', ') : 'No locations set';
  }
}
