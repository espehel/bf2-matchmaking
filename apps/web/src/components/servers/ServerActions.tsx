import { GameStatus, isConnectedLiveServer } from '@bf2-matchmaking/types';
import { formatSecToMin, fromSnakeToCapitalized } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import {
  restartServerInfantry,
  restartServerVehicles,
} from '@/app/servers/[server]/actions';
import GuardedActionButton from '@/components/commons/GuardedActionButton';
import RevalidateForm from '@/components/RevalidateForm';
import { LiveServer } from '@bf2-matchmaking/types/server';

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
      <Heading server={server} />
      <div className="divider" />
      <div className="flex gap-2">
        <GuardedActionButton
          label="Restart to infantry"
          guard={server.live ? server.live.players.length > 0 : false}
          guardLabel="Server is populated, are you sure you want to restart?"
          formAction={restartServerInfantrySA}
          successMessage="Server restarting with infantry mode"
          errorMessage="Failed to restart server with infantry mode"
          disabled={!hasAdmin}
        />
        <GuardedActionButton
          label="Restart to vehicles"
          guard={server.live ? server.live.players.length > 0 : false}
          guardLabel="Server is populated, are you sure you want to restart?"
          formAction={restartServerVehiclesSA}
          successMessage="Server restarting with vehicles mode"
          errorMessage="Failed to restart server with vehicles mode"
          disabled={!hasAdmin}
        />
      </div>
    </section>
  );
}

function Heading({ server }: { server: LiveServer }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 items-center">
        <h2 className="text-2xl">Server Actions</h2>
        <RevalidateForm path={`/servers/${server.address}`} />
      </div>
      <p>{`Updated: ${
        server.updatedAt ? DateTime.fromISO(server.updatedAt).toFormat('TTT') : '-'
      }`}</p>
      {isConnectedLiveServer(server) && (
        <>
          <p>{`Game status: ${getKeyName(server.live.currentGameStatus)}`}</p>
          <p>{`Map: ${fromSnakeToCapitalized(server.live.currentMapName)}`}</p>
          <p>{`Next Map: ${fromSnakeToCapitalized(server.live.nextMapName)}`}</p>
          <p>{`Time left: ${formatSecToMin(server.live.timeLeft)}`}</p>
          <p>{`No Vehicles: ${server.data.noVehicles ? 'Yes' : 'No'}`}</p>
        </>
      )}
    </div>
  );
}

const getKeyName = (status: GameStatus) =>
  Object.keys(GameStatus).at(Object.values(GameStatus).indexOf(status));
