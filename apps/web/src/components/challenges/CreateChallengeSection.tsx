import ActionForm from '@/components/form/ActionForm';
import { createChallenge } from '@/app/challenges/actions';
import Select from '@/components/commons/Select';
import DatetimeInput from '@/components/commons/DatetimeInput';
import { DateTime } from 'luxon';
import SubmitActionFormButton from '@/components/form/SubmitActionFormButton';
import React from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { sortByName } from '@bf2-matchmaking/utils';
import { MatchConfigsRow, PlayersRow, VisibleTeam } from '@bf2-matchmaking/types';

export default async function CreateChallengeSection() {
  const player = await supabase(cookies).getSessionPlayerOrThrow();
  const configs = await supabase(cookies)
    .getMatchConfigs()
    .then(verifyResult)
    .then(filterLadder);

  const teams = await supabase(cookies).getVisibleTeams().then(verifyResult);
  const myTeams = teams.filter(isPlayerTeam(player));

  const servers = await supabase(cookies)
    .getServers()
    .then(verifyResult)
    .then(sortByName);
  const maps = await supabase(cookies).getMaps().then(verifyResult).then(sortByName);
  return (
    <section className="section w-fit">
      <h2>Create challenge</h2>
      <ActionForm
        action={createChallenge}
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
          <div className="flex gap-4">
            <Select
              label="My team"
              name="homeTeam"
              options={myTeams.map(({ id, name }) => [id, name])}
            />
            <Select
              label="Opponent"
              name="awayTeam"
              placeholder="Open challenge"
              options={teams.map(({ id, name }) => [id, name])}
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
        </div>
        <div className="flex gap-4">
          <Select
            options={maps.map(({ id, name }) => [id, name])}
            label="Home map"
            name="homeMap"
          />
          <Select
            options={servers.map(({ ip, name }) => [ip, name])}
            label="Home server"
            name="homeServer"
          />
        </div>
        <SubmitActionFormButton>Create challenge</SubmitActionFormButton>
      </ActionForm>
    </section>
  );
}

function isPlayerTeam(player: PlayersRow) {
  return (team: VisibleTeam) => team.players.some((p) => player.id === p.player_id);
}

function filterLadder(array: Array<MatchConfigsRow>): Array<MatchConfigsRow> {
  return array.filter((c) => c.type === 'Ladder');
}
