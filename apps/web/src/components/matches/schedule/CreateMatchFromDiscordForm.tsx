import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { createScheduledMatch } from '@/app/matches/actions';
import React from 'react';
import ActionFormModal from '@/components/commons/ActionFormModal';
import { DiscordMessageFieldset } from '@/components/matches/schedule/DiscordMessageFieldset';
import { DateTime } from 'luxon';
import { MapsRow, ServersRow } from '@bf2-matchmaking/types';
import Fieldset from '@/components/form/Fieldset';
import MultiSelect from '@/components/form/fields/MultiSelect';
import DatetimeInput from '@/components/form/fields/DatetimeInput';

interface Props {
  defaultTime?: string;
  defaultServers?: Array<string>;
  defaultMaps?: Array<number>;
}

export default async function CreateMatchFromDiscordForm({
  defaultTime,
  defaultServers,
  defaultMaps,
}: Props) {
  const cookieStore = await cookies();
  const servers = await supabase(cookieStore).getServers().then(verifyResult);
  const maps = await supabase(cookieStore).getMaps().then(verifyResult);
  console.log(defaultMaps);
  console.log(defaultServers);
  return (
    <ActionFormModal
      title="Create discord match"
      openBtnLabel="Create discord match"
      openBtnKind="btn-secondary"
      openBtnSize="btn-lg"
      action={createScheduledMatch}
      successMessage="Match scheduled."
      errorMessage="Failed to create match"
      className="flex flex-col gap-4"
    >
      <DiscordMessageFieldset
        setSearchParamsOnParse={true}
        servers={servers}
        maps={maps}
      />
      <Fieldset legend="Override message">
        <DatetimeInput
          label="Match start"
          name="scheduledInput"
          defaultValue={
            defaultTime ||
            DateTime.utc().plus({ day: 1 }).set({ hour: 19, minute: 0 }).toISO()
          }
          min={DateTime.utc().toISO()}
        />
        <MultiSelect
          name="serverSelect"
          placeholder="Select servers"
          options={servers.map(({ ip, name }) => [ip, name])}
          defaultOptions={
            defaultServers &&
            servers
              .filter(isDefaultServer(defaultServers))
              .map(({ ip, name }) => [ip, name])
          }
        />
        <MultiSelect
          name="mapSelect"
          placeholder="Select maps"
          options={maps.map(({ id, name }) => [id, name])}
          defaultOptions={
            defaultMaps &&
            maps.filter(isDefaultMap(defaultMaps)).map(({ id, name }) => [id, name])
          }
        />
      </Fieldset>
    </ActionFormModal>
  );
}

function isDefaultServer(defaultServers: Array<string>) {
  return (server: ServersRow) => defaultServers.includes(server.ip);
}
function isDefaultMap(defaultMaps: Array<number>) {
  return (map: MapsRow) => defaultMaps.includes(map.id);
}
