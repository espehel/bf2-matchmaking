import RevalidateForm from '@/components/RevalidateForm';
import { getKey } from '@bf2-matchmaking/utils/src/object-utils';
import { GameStatus, MatchesJoined } from '@bf2-matchmaking/types';
import { formatSecToMin } from '@bf2-matchmaking/utils';
import Link from 'next/link';
import { ConnectedLiveServer } from '@bf2-matchmaking/types/server';

interface Props {
  match: MatchesJoined;
  server: ConnectedLiveServer;
}
export default async function ServerInfo({ server, match }: Props) {
  return (
    <>
      <div>
        <div className="flex justify-between items-center gap-2">
          <h2 className="text-xl">{`Server: ${server.data.name}`}</h2>
          <RevalidateForm path={`/matches/${match.id}`} />
        </div>
        <p className="font-bold">{`${server.address}:${server.data.port}`}</p>
        <div className="grid grid-cols-2 gap-x-2">
          <div>{`Game status: ${getKey(GameStatus, server.live.currentGameStatus)}`}</div>
          <div>{`Players: ${server.live.connectedPlayers}`}</div>
          <div>{`Map: ${server.live.currentMapName}`}</div>
          <div>{`Round time: ${formatSecToMin(server.live.roundTime)}`}</div>
        </div>
      </div>
      <Link
        className="btn btn-primary btn-lg btn-wide m-auto"
        href={server.data.joinmeDirect}
        target="_blank"
      >
        Join match
      </Link>
    </>
  );
}
