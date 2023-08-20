import { GameStatus, MatchesJoined } from '@bf2-matchmaking/types';
import { api, formatSecToMin } from '@bf2-matchmaking/utils';
import ServerActions from '@/components/match/ServerActions';
import RevalidateForm from '@/components/RevalidateForm';
import { getKey } from '@bf2-matchmaking/utils/src/object-utils';

interface Props {
  match: MatchesJoined;
  isMatchAdmin: boolean;
}

export default async function ServerSection({ match, isMatchAdmin }: Props) {
  if (!match.server) {
    return null;
  }
  const { data: server } = await api.rcon().getServer(match.server.ip);

  return (
    <section className="section text-left">
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
        {isMatchAdmin && <ServerActions match={match} server={server} />}
      </div>
    </section>
  );
}