import { Challenge, MapsRow, PlayersRow, VisibleTeam } from '@bf2-matchmaking/types';
import ActionFormModal from '@/components/commons/ActionFormModal';
import { acceptChallenge } from '@/app/challenges/actions';
import Select from '@/components/commons/Select';
import React from 'react';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { sortByName } from '@bf2-matchmaking/utils';

interface Props {
  challenge: Challenge;
}

export default async function AcceptChallengeModal({ challenge }: Props) {
  const player = await supabase(cookies).getSessionPlayerOrThrow();
  const teams = await supabase(cookies).getVisibleTeams().then(verifyResult);
  const availableTeams = teams
    .filter(isPlayerTeam(player))
    .filter(isNotHomeTeam(challenge));

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
      extras={{ challengeId: challenge.id.toString() }}
    >
      <Select
        label="My team"
        name="awayTeam"
        options={availableTeams.map(({ id, name }) => [id, name])}
      />
      <Select
        options={availableMaps.map(({ id, name }) => [id, name])}
        label="Away map"
        name="awayMap"
      />
      <Select
        options={servers.map(({ ip, name }) => [ip, name])}
        label="Away server"
        name="awayServer"
        defaultValue={challenge.home_server.ip}
      />
    </ActionFormModal>
  );
}

function isPlayerTeam(player: PlayersRow) {
  return (team: VisibleTeam) => team.players.some((p) => player.id === p.player_id);
}
function isNotHomeTeam(challenge: Challenge) {
  return (team: VisibleTeam) => team.id !== challenge.home_team.id;
}
function isNotHomeMap(challenge: Challenge) {
  return (map: MapsRow) => map.id !== challenge.home_map.id;
}
