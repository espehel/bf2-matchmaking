import { createScheduledMatch } from '@/app/matches/actions';
import Select from '@/components/commons/Select';
import DatetimeInput from '@/components/commons/DatetimeInput';
import { DateTime } from 'luxon';
import FormSubmitButton from '@/components/FormSubmitButton';
import ActionForm from '@/components/commons/ActionForm';
import React from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import {
  MatchConfigsRow,
  PlayersRow,
  TeamsJoined,
  TeamsRow,
  VisibleTeam,
} from '@bf2-matchmaking/types';

export default async function ChallengePage() {
  const player = await supabase(cookies).getSessionPlayerOrThrow();
  const configs = await supabase(cookies)
    .getMatchConfigs()
    .then(verifyResult)
    .then(filterVisible)
    .then(filterLadder);
  const teams = await supabase(cookies)
    .getVisibleTeams()
    .then(verifyResult)
    .then(filterVisible);
  const myTeams = teams.filter(isPlayerTeam(player));
  return (
    <main className="main">
      <h1>Challenges</h1>
      <section className="section mt-4">
        <h2>Create challenge</h2>
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
              label="My team"
              name="homeSelect"
              options={myTeams.map(({ id, name }) => [id, name])}
            />
            <Select
              label="opponent"
              name="awaySelect"
              options={teams.map(({ id, name }) => [id, name])}
            />
          </div>
          {/*<MatchServerSelect servers={servers} regions={regions} />
          <MultiSelect
            name="mapsSelect"
            placeholder="Select maps"
            label="Maps"
            options={maps.map((map) => [map.id, map.name])}
          />*/}
          <div className="flex items-center justify-end">
            <FormSubmitButton>Schedule match</FormSubmitButton>
          </div>
        </ActionForm>
      </section>
    </main>
  );
}

function isPlayerTeam(player: PlayersRow) {
  return (team: VisibleTeam) => team.players.some((p) => player.id === p.player_id);
}

function filterVisible<T extends { visible: boolean }>(array: Array<T>): Array<T> {
  return array.filter((e) => e.visible);
}
function filterLadder(array: Array<MatchConfigsRow>): Array<MatchConfigsRow> {
  return array.filter((c) => c.type === 'Ladder');
}
