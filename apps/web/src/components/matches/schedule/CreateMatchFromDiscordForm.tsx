import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import React from 'react';
import ActionModal from '@/components/commons/action/ActionModal';
import { DiscordMessageFieldset } from '@/components/matches/schedule/DiscordMessageFieldset';
import { DateTime } from 'luxon';
import { MapsRow, ServersRow } from '@bf2-matchmaking/types';
import Fieldset from '@/components/form/Fieldset';
import MultiSelect from '@/components/form/fields/MultiSelect';
import DatetimeInput from '@/components/form/fields/DatetimeInput';
import { scheduleDiscordMatch } from '@/app/matches/schedule/actions';

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
  return (
    <ActionModal
      title="Create discord match"
      openBtnLabel="Create discord match"
      openBtnKind="btn-secondary"
      openBtnSize="btn-lg"
      action={scheduleDiscordMatch}
      className="flex flex-col gap-4"
    >
      <DiscordMessageFieldset servers={servers} maps={maps} />
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
          key={defaultServers?.length}
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
          key={defaultMaps?.length}
          name="mapSelect"
          placeholder="Select maps"
          options={maps.map(({ id, name }) => [id, name])}
          defaultOptions={
            defaultMaps &&
            maps.filter(isDefaultMap(defaultMaps)).map(({ id, name }) => [id, name])
          }
        />
      </Fieldset>
    </ActionModal>
  );
}

function isDefaultServer(defaultServers: Array<string>) {
  return (server: ServersRow) => defaultServers.includes(server.ip);
}
function isDefaultMap(defaultMaps: Array<number>) {
  return (map: MapsRow) => defaultMaps.includes(map.id);
}
