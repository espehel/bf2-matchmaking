import { MatchServer } from '@bf2-matchmaking/types';
import Link from 'next/link';

interface Props {
  matchId: number;
  matchServer: MatchServer | null;
}

export default function ServerSection({ matchServer, matchId }: Props) {
  const header = matchServer?.server?.name || 'No match server set';
  const region = `Default region: ${matchServer?.region || 'No region set'}`;
  const instance = `Current instance: ${matchServer?.instance || 'No instance assigned'}`;
  return (
    <section className="section gap-2">
      <h2>{header}</h2>
      <p>{region}</p>
      <p>{instance}</p>
      <Link className="btn btn-secondary w-fit" href={`/matches/${matchId}`}>
        Back to match
      </Link>
    </section>
  );
}
