import { GameStatus, LiveInfo, LiveServer } from '@bf2-matchmaking/types';
import { formatSecToMin } from '@bf2-matchmaking/utils';
import JoinMeButton from '@/components/servers/JoinMeButton';
import { DateTime } from 'luxon';

interface Props {
  server: LiveServer;
}

export default function ServerInfoSection({ server }: Props) {
  const { info } = server;
  return (
    <section className="bg-base-100 border-primary border-2 rounded p-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl">Server info</h2>
          <p>{`Updated: ${
            server.updatedAt ? DateTime.fromISO(server.updatedAt).toFormat('DDD, T') : '-'
          }`}</p>
          <p>{`Game status: ${getKeyName(info.currentGameStatus)}`}</p>
          <p>{`Map: ${info.currentMapName}`}</p>
          <p>{`Time left: ${formatSecToMin(info.timeLeft)}`}</p>
        </div>
        <PlayersSection info={info} />
      </div>
      <div className="divider" />
      <JoinMeButton server={server} />
    </section>
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
