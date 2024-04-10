import { LiveServer, MatchesJoined } from '@bf2-matchmaking/types';
import Link from 'next/link';
import SelectServerForm from '@/components/matches/SelectServerForm';

interface Props {
  match: MatchesJoined;
  server: LiveServer | null;
}

export default function ActiveServerSection({ server, match }: Props) {
  return (
    <section className="section gap-2">
      <h2>{`Active server: ${server?.info.serverName || 'No match server set'}`}</h2>
      <SelectServerForm match={match} defaultAddress={server?.address} />
      <Link className="btn btn-secondary w-fit" href={`/matches/${match.id}`}>
        Back to match
      </Link>
    </section>
  );
}
