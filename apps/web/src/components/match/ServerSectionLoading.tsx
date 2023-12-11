import { MatchesJoined, MatchServer } from '@bf2-matchmaking/types';
import RevalidateForm from '@/components/RevalidateForm';

interface Props {
  match: MatchesJoined;
  matchServer: MatchServer | null;
}

export default function ServerSectionLoading({ match, matchServer }: Props) {
  if (!matchServer?.server) {
    return null;
  }

  return (
    <section className="section max-w-md text-left">
      <div>
        <div className="flex justify-between items-center gap-2">
          <h2 className="text-xl">{`Server: ${matchServer.server.name}`}</h2>
          <RevalidateForm path={`/matches/${match.id}`} />
        </div>
        <p className="font-bold">{`${matchServer.server.ip}:${matchServer.server.port}`}</p>
      </div>
      <div className="text-center">
        <span className="loading loading-bars loading-lg" />
      </div>
    </section>
  );
}
