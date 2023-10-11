import { GameStatus, ServerInfo } from '@bf2-matchmaking/types';
import { formatSecToMin } from '@bf2-matchmaking/utils';

interface Props {
  serverInfo: ServerInfo | null;
}

export default function ServerInfoSection({ serverInfo }: Props) {
  if (!serverInfo) {
    return (
      <section className="bg-base-100 border-error border-2 rounded p-4">
        <h2 className="text-xl">Server info</h2>
        <p>Failed to set up rcon connection to server</p>
      </section>
    );
  }

  return (
    <section className="bg-base-100 border-primary border-2 rounded p-4">
      <h2 className="text-xl">Server info</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>{`Name: ${serverInfo.serverName}`}</div>
        <div>{`Game status: ${getKeyName(serverInfo.currentGameStatus)}`}</div>
        <div>{`Players: ${serverInfo.connectedPlayers}/${serverInfo.maxPlayers}`}</div>
        <div>{`Map: ${serverInfo.currentMapName}`}</div>
        <div>{`Round time: ${formatSecToMin(serverInfo.roundTime)}`}</div>
        <div>{`Time left: ${formatSecToMin(serverInfo.timeLeft)}`}</div>
        <div>{`Time limit: ${formatSecToMin(serverInfo.timeLimit)}`}</div>
      </div>
    </section>
  );
}

const getKeyName = (status: GameStatus) =>
  Object.keys(GameStatus).at(Object.values(GameStatus).indexOf(status));
