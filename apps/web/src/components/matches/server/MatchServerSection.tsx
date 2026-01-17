import { MatchesJoined } from '@bf2-matchmaking/types';
import ServerActions from '@/components/matches/server/ServerActions';
import NoServer from '@/components/matches/server/NoServer';
import ServerInfo from '@/components/matches/server/ServerInfo';
import Link from 'next/link';
import AddServerForm from '@/components/matches/AddServerForm';
import { api } from '@bf2-matchmaking/utils';

interface Props {
  match: MatchesJoined;
}

export default async function MatchServerSection({ match }: Props) {
  const { data: activeServer } = await api.v2.getMatchServer(match.id);

  return (
    <div className="card bg-base-200 shadow-md border border-base-300 animate-slide-up w-full">
      <div className="card-body">
        {!activeServer && <NoServer match={match} />}
        {activeServer && (
          <>
            <ServerInfo match={match} server={activeServer} />
            <ServerActions match={match} server={activeServer} />
            <div className="divider" />
          </>
        )}
        <AddServerForm match={match} />
        <Link
          className="btn btn-outline btn-accent w-fit ml-auto"
          href={`/matches/${match.id}/server`}
        >
          Manage match servers
        </Link>
      </div>
    </div>
  );
}
