import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import Select from '@/components/commons/Select';
import DatetimeInput from '@/components/commons/DatetimeInput';
import { createScheduledMatch } from '@/app/matches/actions';
import { DateTime } from 'luxon';
import React from 'react';
import ActionFormModal from '@/components/commons/ActionFormModal';
import ServerMultiSelect from '@/components/form/ServerMultiSelect';
import MapMultiSelect from '@/components/form/MapMultiSelect';

export default async function ScheduleMatchForm() {
  const { data: player } = await supabase(cookies).getSessionPlayer();
  const configs = await supabase(cookies)
    .getMatchConfigs()
    .then(verifyResult)
    .then(filterVisible);
  const teams = await supabase(cookies)
    .getActiveTeams()
    .then(verifyResult)
    .then(sortByName);
  const servers = await supabase(cookies).getServers().then(verifyResult);
  const maps = await supabase(cookies).getMaps().then(verifyResult);

  const defaultHomeTeam = teams.find((t) =>
    t.players.some((p) => p.player_id === player?.id)
  )?.id;
  const defaultAwayTeam = teams.find((t) => t.id !== defaultHomeTeam)?.id;

  return (
    <ActionFormModal
      title="Schedule match"
      openBtnLabel="Schedule match"
      openBtnKind="btn-primary"
      openBtnSize="btn-sm"
      action={createScheduledMatch}
      successMessage="Match scheduled."
      errorMessage="Failed to schedule match"
      className="flex flex-col gap-4"
    >
      <div className="flex gap-4">
        <Select
          label="Match type"
          name="configSelect"
          options={configs.map(({ id, name }) => [id, name])}
        />
        <DatetimeInput
          label="Match start"
          name="scheduledInput"
          defaultValue={DateTime.utc()
            .plus({ day: 1 })
            .set({ hour: 19, minute: 0 })
            .toISO()}
          min={DateTime.utc().toISO()}
        />
      </div>
      <div className="flex gap-4">
        <Select
          label="Home team"
          name="homeSelect"
          options={teams.map(({ id, name }) => [id, name])}
          defaultValue={defaultHomeTeam}
        />
        <Select
          label="Away team"
          name="awaySelect"
          options={teams.map(({ id, name }) => [id, name])}
          defaultValue={defaultAwayTeam}
        />
      </div>
      <ServerMultiSelect servers={servers} />
      <MapMultiSelect maps={maps} />
    </ActionFormModal>
  );
}

function filterVisible<T extends { visible: boolean }>(array: Array<T>): Array<T> {
  return array.filter((e) => e.visible);
}

function sortByName<T extends { name: string }>(array: Array<T>): Array<T> {
  return [...array].sort((a, b) => a.name.localeCompare(b.name));
}

export function ScheduledMatchFormFallback() {
  return (
    <button className="btn btn-primary ml-auto" disabled={true}>
      Schedule new match
    </button>
  );
}
