import { MatchesJoined } from '@bf2-matchmaking/types';
import Link from 'next/link';
import AddServerForm from '@/components/matches/AddServerForm';
import { api } from '@bf2-matchmaking/utils';
import MatchServerList from '@/components/matches/MatchServerList';

interface Props {
  match: MatchesJoined;
}

export default async function ActiveServerSection({ match }: Props) {
  const { data: server } = await api.live().getMatchServer(match.id);
  return (
    <section className="section gap-2">
      <h2>{`Active server: ${server?.name || 'No match server set'}`}</h2>
      <MatchServerList match={match} />
      <AddServerForm match={match} />
      <Link className="btn btn-secondary w-fit" href={`/matches/${match.id}`}>
        Back to match
      </Link>
    </section>
  );
}
