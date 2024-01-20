import RevalidateForm from '@/components/RevalidateForm';
import { getKey } from '@bf2-matchmaking/utils/src/object-utils';
import { GameStatus, MatchesJoined, ServersRow } from '@bf2-matchmaking/types';
import { api, formatSecToMin } from '@bf2-matchmaking/utils';
import Link from 'next/link';

interface Props {
  match: MatchesJoined;
  server: ServersRow;
}
export default async function ServerInfo({ server, match }: Props) {
  const { data } = await api.rcon().getServer(server.ip);
  const serverInfo = data?.info;

  return (
    <>
      <div>
        <div className="flex justify-between items-center gap-2">
          <h2 className="text-xl">{`Server: ${server.name}`}</h2>
          <RevalidateForm path={`/matches/${match.id}`} />
        </div>
        <p className="font-bold">{`${server.ip}:${server.port}`}</p>
        {serverInfo && (
          <div className="grid grid-cols-2 gap-x-2">
            <div>{`Game status: ${getKey(
              GameStatus,
              serverInfo.currentGameStatus
            )}`}</div>
            <div>{`Players: ${serverInfo.connectedPlayers}`}</div>
            <div>{`Map: ${serverInfo.currentMapName}`}</div>
            <div>{`Round time: ${formatSecToMin(serverInfo.roundTime)}`}</div>
          </div>
        )}
      </div>
      {data && (
        <Link
          className="btn btn-primary btn-lg btn-wide m-auto"
          href={data.joinmeDirect}
          target="_blank"
        >
          Join match
        </Link>
      )}
    </>
  );
}
