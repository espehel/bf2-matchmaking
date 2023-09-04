import { GameStatus, MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { api, formatSecToMin, getJoinmeHref } from '@bf2-matchmaking/utils';
import ServerActions from '@/components/match/ServerActions';
import RevalidateForm from '@/components/RevalidateForm';
import { getKey } from '@bf2-matchmaking/utils/src/object-utils';
import Link from 'next/link';

interface Props {
  match: MatchesJoined;
  isMatchAdmin: boolean;
  isMatchPlayer: boolean;
}

export default async function ServerSection({
  match,
  isMatchAdmin,
  isMatchPlayer,
}: Props) {
  if (!match.server) {
    return null;
  }

  const { data: server } = await api.rcon().getServer(match.server.ip);

  return (
    <section className="section max-w-md text-left">
      <div>
        <div className="flex justify-between items-center">
          <h2 className="text-xl">{`Server: ${match.server.name}`}</h2>
          <RevalidateForm path={`/matches/${match.id}`} />
        </div>
        <p className="font-bold">{`${match.server.ip}:${match.server.port}`}</p>
        {server?.info && (
          <div className="grid grid-cols-2 gap-x-2">
            <div>{`Game status: ${getKey(
              GameStatus,
              server.info.currentGameStatus
            )}`}</div>
            <div>{`Players: ${server.info.connectedPlayers}`}</div>
            <div>{`Map: ${server.info.currentMapName}`}</div>
            <div>{`Round time: ${formatSecToMin(server.info.roundTime)}`}</div>
          </div>
        )}
      </div>
      {server && isMatchPlayer && (
        <Link
          className="btn btn-primary btn-lg btn-wide m-auto"
          href={server.joinmeHref}
          target="_blank"
        >
          Join match
        </Link>
      )}
      {isMatchAdmin && match.status !== MatchStatus.Closed && (
        <div>
          <div className="divider mt-0" />
          <ServerActions match={match} server={server} />
        </div>
      )}
    </section>
  );
}
