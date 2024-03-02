import { MatchesJoined, MatchServer } from '@bf2-matchmaking/types';
import Link from 'next/link';
import SelectServerForm from '@/components/matches/SelectServerForm';

interface Props {
  match: MatchesJoined;
  matchServer: MatchServer | null;
}

export default function ActiveServerSection({ matchServer, match }: Props) {
  return (
    <section className="section gap-2">
      <h2>{`Active server: ${matchServer?.server?.name || 'No match server set'}`}</h2>
      <SelectServerForm match={match} matchServer={matchServer} />
      <Link className="btn btn-secondary w-fit" href={`/matches/${match.id}`}>
        Back to match
      </Link>
    </section>
  );
}
