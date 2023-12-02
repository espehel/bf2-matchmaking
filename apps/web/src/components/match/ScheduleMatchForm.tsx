import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import FormSubmitButton from '@/components/FormSubmitButton';
import Select from '@/components/commons/Select';
import DatetimeInput from '@/components/commons/DatetimeInput';
import { createScheduledMatch } from '@/app/matches/actions';
import CollapseControl from '@/components/commons/CollapseControl';
import MapsSelect from '@/components/commons/MapsSelect';
import { DateTime } from 'luxon';
import ActionForm from '@/components/commons/ActionForm';
import React from 'react';
import MatchServerSelect from '@/components/match/MatchServerSelect';
import { api } from '@bf2-matchmaking/utils';

export default async function ScheduleMatchForm() {
  const configs = await supabase(cookies)
    .getMatchConfigs()
    .then(verifyResult)
    .then(filterVisible);
  const teams = await supabase(cookies)
    .getVisibleTeams()
    .then(verifyResult)
    .then(filterVisible);
  const servers = await supabase(cookies).getServers().then(verifyResult);
  const isTeamOfficer = await supabase(cookies).isTeamOfficer();
  const maps = await supabase(cookies).getMaps().then(verifyResult);
  const { data: regions } = await api.platform().getLocations();

  return (
    <div className="max-w-5xl mx-auto">
      <CollapseControl label="Schedule match" disabled={!isTeamOfficer}>
        <ActionForm
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
                .set({ hour: 20, minute: 0 })
                .toISO()}
              min={DateTime.utc().toISO()}
            />
          </div>
          <div className="flex gap-4">
            <Select
              label="Home team"
              name="homeSelect"
              options={teams.map(({ id, name }) => [id, name])}
            />
            <Select
              label="Away team"
              name="awaySelect"
              options={teams.map(({ id, name }) => [id, name])}
            />
          </div>
          <MatchServerSelect servers={servers} regions={regions} />
          <MapsSelect maps={maps} />
          <div className="flex items-center justify-end">
            <FormSubmitButton>Schedule match</FormSubmitButton>
          </div>
        </ActionForm>
      </CollapseControl>
    </div>
  );
}

function filterVisible<T extends { visible: boolean }>(array: Array<T>): Array<T> {
  return array.filter((e) => e.visible);
}

export function ScheduledMatchFormFallback() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-right">
        <button className="btn btn-primary ml-auto" disabled={true}>
          Schedule match
        </button>
      </div>
    </div>
  );
}
