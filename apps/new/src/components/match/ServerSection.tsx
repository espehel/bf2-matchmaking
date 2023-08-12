import { MatchesJoined } from '@bf2-matchmaking/types';
import { api } from '@bf2-matchmaking/utils';
import ServerActions from '@/components/match/ServerActions';
import RevalidateForm from '@/components/RevalidateForm';

interface Props {
  match: MatchesJoined;
}

export default async function ServerSection({ match }: Props) {
  if (!match.server) {
    return null;
  }
  const { data: serverInfo } = await api.rcon().getServer(match.server.ip);

  return (
    <section className="section text-left">
      <div>
        <div className="flex justify-between items-center">
          <h2 className="text-xl">{`Server: ${match.server.name}`}</h2>
          <RevalidateForm path={`/matches/${match.id}`} />
        </div>
        <p className="font-bold">{`${match.server.ip}:${match.server.port}`}</p>
        <ServerActions match={match} server={serverInfo} />
      </div>
    </section>
  );
}
