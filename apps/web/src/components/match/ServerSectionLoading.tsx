import { MatchesJoined } from '@bf2-matchmaking/types';
import RevalidateForm from '@/components/RevalidateForm';

interface Props {
  match: MatchesJoined;
}

export default function ServerSectionLoading({ match }: Props) {
  if (!match.server) {
    return null;
  }

  return (
    <section className="section max-w-md text-left">
      <div>
        <div className="flex justify-between items-center gap-2">
          <h2 className="text-xl">{`Server: ${match.server.name}`}</h2>
          <RevalidateForm path={`/matches/${match.id}`} />
        </div>
        <p className="font-bold">{`${match.server.ip}:${match.server.port}`}</p>
      </div>
      <div className="text-center">
        <span className="loading loading-bars loading-lg" />
      </div>
    </section>
  );
}
