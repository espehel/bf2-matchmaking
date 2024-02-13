import { GameStatus, LiveInfo, LiveServer } from '@bf2-matchmaking/types';
import { formatSecToMin } from '@bf2-matchmaking/utils';
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

interface Props {
  server: LiveServer;
}

export default async function ServerInteractions({ server }: Props) {
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();
  async function restartServerInfantrySA() {
    'use server';
    return restartServerInfantry(server.address);
  }
  async function restartServerVehiclesSA() {
    'use server';
    return restartServerVehicles(server.address);
  }

  return (
    <section className="bg-base-100 border-primary border-2 rounded p-4">
      <div className="grid grid-cols-2 gap-4">
        <Heading server={server} />
        <PlayersSection info={server.info} />
      </div>
      {adminRoles?.server_admin && (
        <>
          <div className="divider" />
          <div className="flex gap-2">
            <JoinMeButton server={server} />
            <GuardedActionButton
              label="Restart to infantry"
              guard={server.info.players.length > 0}
              guardLabel="Server is populated, are you sure you want to restart?"
              action={restartServerInfantrySA}
              successMessage="Server restarting with infantry mode"
              errorMessage="Failed to restart server with infantry mode"
            />
            <GuardedActionButton
              label="Restart to vehicles"
              guard={server.info.players.length > 0}
              guardLabel="Server is populated, are you sure you want to restart?"
              action={restartServerVehiclesSA}
              successMessage="Server restarting with vehicles mode"
              errorMessage="Failed to restart server with vehicles mode"
            />
          </div>
        </>
      )}
    </section>
  );
}

function Heading({ server }: { server: LiveServer }) {
  const { info } = server;
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-2xl">Server info</h2>
      <p>{`Updated: ${
        server.updatedAt ? DateTime.fromISO(server.updatedAt).toFormat('TTT') : '-'
      }`}</p>
      <p>{`Game status: ${getKeyName(info.currentGameStatus)}`}</p>
      <p>{`Map: ${info.currentMapName}`}</p>
      <p>{`Time left: ${formatSecToMin(info.timeLeft)}`}</p>
    </div>
  );
}

function PlayersSection({ info }: { info: LiveInfo }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grow border rounded p-4 overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Id</th>
              <th>Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {info.players.map((p) => (
              <tr>
                <td>{p.index}</td>
                <td>{p.getName}</td>
                <td>{p.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {info.players.length === 0 && (
          <div className="p-2 font-bold">Empty server...</div>
        )}
      </div>
      <p>{`Players: ${info.connectedPlayers}/${info.maxPlayers}`}</p>
    </div>
  );
}

const getKeyName = (status: GameStatus) =>
  Object.keys(GameStatus).at(Object.values(GameStatus).indexOf(status));
