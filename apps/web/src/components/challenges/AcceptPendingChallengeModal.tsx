import { Challenge, MapsRow, PendingChallenge } from '@bf2-matchmaking/types';
import ActionFormModal from '@/components/commons/ActionFormModal';
import { acceptChallenge } from '@/app/challenges/actions';
import Select from '@/components/commons/Select';
import React from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { sortByName } from '@bf2-matchmaking/utils';
import DatetimeInput from '@/components/commons/DatetimeInput';
import { DateTime } from 'luxon';

interface Props {
  challenge: PendingChallenge;
}

export default async function AcceptPendingChallengeModal({ challenge }: Props) {
  const servers = await supabase(cookies)
    .getServers()
    .then(verifyResult)
    .then(sortByName);

  const maps = await supabase(cookies).getMaps().then(verifyResult).then(sortByName);
  const availableMaps = maps.filter(isNotHomeMap(challenge));

  return (
    <ActionFormModal
      title="Accept Challenge"
      openBtnLabel="Accept"
      openBtnKind="btn-primary"
      openBtnSize="btn-md"
      action={acceptChallenge}
      errorMessage="Failed to accept challenge"
      successMessage="Challenge accepted"
      extras={{
        challengeId: challenge.id.toString(),
        awayTeam: challenge.away_team.id.toString(),
      }}
    >
      <div className="p-4">
        <p>Home team: {challenge.home_team.name}</p>
        <p>Away team: {challenge.away_team.name}</p>
        <p>Home map: {challenge.home_map.name}</p>
        <p>Home server: {challenge.home_server.name}</p>
      </div>
      <DatetimeInput
        label="Match start"
        name="scheduledInput"
        defaultValue={challenge.scheduled_at}
        min={DateTime.utc().toISO()}
      />
      <Select
        options={availableMaps.map(({ id, name }) => [id, name])}
        label="Away map"
        name="awayMap"
        defaultValue={challenge.away_map?.id}
        readonly={Boolean(challenge.away_map)}
      />
      <Select
        options={servers.map(({ ip, name }) => [ip, name])}
        label="Away server"
        name="awayServer"
        defaultValue={challenge.away_server?.ip || challenge.home_server.ip}
        readonly={Boolean(challenge.away_server)}
      />
    </ActionFormModal>
  );
}

function isNotHomeMap(challenge: Challenge) {
  return (map: MapsRow) => map.id !== challenge.home_map.id;
}
