import { GameStatus, LiveInfo, LiveServer } from '@bf2-matchmaking/types';
import { formatSecToMin, fromSnakeToCapitalized } from '@bf2-matchmaking/utils';
import JoinMeButton from '@/components/servers/JoinMeButton';
import { DateTime } from 'luxon';
import ActionButton from '@/components/ActionButton';
import {
  restartServerInfantry,
  restartServerVehicles,
} from '@/app/servers/[server]/actions';
import GuardedActionButton from '@/components/commons/GuardedActionButton';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import RevalidateForm from '@/components/RevalidateForm';

interface Props {
  server: LiveServer;
  hasAdmin: boolean;
}

export default async function ServerActions({ server, hasAdmin }: Props) {
  async function restartServerInfantrySA() {
    'use server';
    return restartServerInfantry(server.address);
  }
  async function restartServerVehiclesSA() {
    'use server';
    return restartServerVehicles(server.address);
  }

  return (
    <section className="section">
      <div className="grid grid-cols-2 gap-4">
        <Heading server={server} />
      </div>
      <div className="divider" />
      <div className="flex gap-2">
        <GuardedActionButton
          label="Restart to infantry"
          guard={server.live ? server.live.players.length > 0 : false}
          guardLabel="Server is populated, are you sure you want to restart?"
          action={restartServerInfantrySA}
          successMessage="Server restarting with infantry mode"
          errorMessage="Failed to restart server with infantry mode"
          disabled={!hasAdmin}
        />
        <GuardedActionButton
          label="Restart to vehicles"
          guard={server.live ? server.live.players.length > 0 : false}
          guardLabel="Server is populated, are you sure you want to restart?"
          action={restartServerVehiclesSA}
          successMessage="Server restarting with vehicles mode"
          errorMessage="Failed to restart server with vehicles mode"
          disabled={!hasAdmin}
        />
      </div>
    </section>
  );
}

function Heading({ server }: { server: LiveServer }) {
  const { live } = server;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 items-center">
        <h2 className="text-2xl">Server Actions</h2>
        <RevalidateForm path={`/servers/${server.address}`} />
      </div>
      <p>{`Updated: ${
        server.updatedAt ? DateTime.fromISO(server.updatedAt).toFormat('TTT') : '-'
      }`}</p>
      {live && (
        <>
          <p>{`Game status: ${getKeyName(live.currentGameStatus)}`}</p>
          <p>{`Map: ${fromSnakeToCapitalized(live.currentMapName)}`}</p>
          <p>{`Next Map: ${fromSnakeToCapitalized(live.nextMapName)}`}</p>;
          <p>{`Time left: ${formatSecToMin(live.timeLeft)}`}</p>;
          <p>{`No Vehicles: ${server.noVehicles ? 'Yes' : 'No'}`}</p>
        </>
      )}
    </div>
  );
}

const getKeyName = (status: GameStatus) =>
  Object.keys(GameStatus).at(Object.values(GameStatus).indexOf(status));
