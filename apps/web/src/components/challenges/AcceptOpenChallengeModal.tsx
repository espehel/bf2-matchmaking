import {
  Challenge,
  isConnectedLiveServer,
  MapsRow,
  PlayersRow,
  ActiveTeam,
} from '@bf2-matchmaking/types';
import ActionFormModal from '@/components/commons/ActionFormModal';
import Select from '@/components/commons/Select';
import React from 'react';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { api, sortByName, sortLiveServerByName, verify } from '@bf2-matchmaking/utils';
import { acceptChallenge } from '@/app/challenges/[team]/actions';

interface Props {
  challenge: Challenge;
}

export default async function AcceptOpenChallengeModal({ challenge }: Props) {
  const cookieStore = await cookies();
  const player = await supabase(cookieStore).getSessionPlayerOrThrow();
  const teams = await supabase(cookieStore).getActiveTeams().then(verifyResult);
  const availableTeams = teams
    .filter(isPlayerTeam(player))
    .filter(isNotHomeTeam(challenge));

  const servers = await api.live().getServers().then(verify).then(sortLiveServerByName);

  const maps = await supabase(cookieStore).getMaps().then(verifyResult).then(sortByName);
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
      <div className="p-4">
        <p>Home team: {challenge.home_team.name}</p>
        <p>Home map: {challenge.home_map.name}</p>
        <p>Home server: {challenge.home_server.name}</p>
      </div>
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
        options={servers
          .filter(isConnectedLiveServer)
          .map(({ address, data }) => [address, data.name])}
        label="Away server"
        name="awayServer"
        defaultValue={challenge.home_server.ip}
      />
    </ActionFormModal>
  );
}

function isPlayerTeam(player: PlayersRow) {
  return (team: ActiveTeam) => team.players.some((p) => player.id === p.player_id);
}
function isNotHomeTeam(challenge: Challenge) {
  return (team: ActiveTeam) => team.id !== challenge.home_team.id;
}
function isNotHomeMap(challenge: Challenge) {
  return (map: MapsRow) => map.id !== challenge.home_map.id;
}
