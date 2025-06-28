import ActionForm from '@/components/form/ActionForm';
import Select from '@/components/commons/Select';
import DatetimeInput from '@/components/commons/DatetimeInput';
import { DateTime } from 'luxon';
import SubmitActionFormButton from '@/components/form/SubmitActionFormButton';
import React from 'react';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { api, sortByName, sortLiveServerByName, verify } from '@bf2-matchmaking/utils';
import {
  isConnectedLiveServer,
  MatchConfigsRow,
  TeamsJoined,
  ActiveTeam,
} from '@bf2-matchmaking/types';
import { createChallenge } from '@/app/challenges/[team]/actions';

interface Props {
  selectedTeam: TeamsJoined;
}

export default async function CreateChallengeSection({ selectedTeam }: Props) {
  const cookieStore = await cookies();
  const configs = await supabase(cookieStore)
    .getMatchConfigs()
    .then(verifyResult)
    .then(filterAvailableChallenge(selectedTeam));
  if (configs.length === 0) {
    return (
      <section className="section min-w-[600px] w-fit h-fit">
        <h2>Create challenge</h2>
        <p>No match types available. Sign up on the left side menu.</p>
      </section>
    );
  }

  const teams = await supabase(cookieStore)
    .getActiveTeams()
    .then(verifyResult)
    .then(filterNotSelectedTeam(selectedTeam))
    .then(filterAvailableTeams(configs));

  const servers = await api.live().getServers().then(verify).then(sortLiveServerByName);
  const maps = await supabase(cookieStore).getMaps().then(verifyResult).then(sortByName);
  return (
    <section className="section min-w-[600px] w-fit h-fit">
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
            defaultValue={configs.at(0)?.id}
            options={configs.map(({ id, name }) => [id, name])}
            readonly={configs.length === 1}
          />
          <div className="flex gap-4">
            <Select
              label="My team"
              name="homeTeam"
              defaultValue={selectedTeam.id}
              readonly={true}
              options={[[selectedTeam.id, selectedTeam.name]]}
            />
            <Select
              label="Opponent"
              name="awayTeam"
              placeholder="Open challenge"
              options={teams.map(({ id, name }) => [id, name])}
            />
          </div>
        </div>
        <div className="w-fit min-w-80">
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
            options={maps.map(({ id, name }) => [id, name])}
            label="Home map"
            name="homeMap"
          />
          <Select
            options={servers
              .filter(isConnectedLiveServer)
              .map(({ address, data }) => [address, data.name])}
            label="Home server"
            name="homeServer"
          />
        </div>
        <SubmitActionFormButton>Create challenge</SubmitActionFormButton>
      </ActionForm>
    </section>
  );
}

function filterAvailableChallenge(team: TeamsJoined) {
  return (configs: Array<MatchConfigsRow>) =>
    configs.filter((config) =>
      team.challenges.some((challenge) => challenge.config === config.id)
    );
}

function filterAvailableTeams(configs: Array<MatchConfigsRow>) {
  return (teams: Array<ActiveTeam>) =>
    teams.filter((team) =>
      configs.some((config) =>
        team.challenges.some((challenge) => challenge.config === config.id)
      )
    );
}

function filterNotSelectedTeam(selectedTeam: TeamsJoined) {
  return (teams: Array<ActiveTeam>) =>
    teams.filter((team) => team.id !== selectedTeam.id);
}
