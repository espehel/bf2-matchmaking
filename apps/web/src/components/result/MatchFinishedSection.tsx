import { MatchesJoined } from '@bf2-matchmaking/types';
import Link from 'next/link';
import { closeMatch } from '@/app/results/[match]/actions';
import ActionButton from '@/components/ActionButton';
import AddResultForm from '@/components/result/AddResultForm';

interface Props {
  match: MatchesJoined;
}

export default function MatchFinishedSection({ match }: Props) {
  async function closeMatchSA() {
    'use server';
    return closeMatch(match.id);
  }
  return (
    <section className="section text-left">
      <h2 className="text-xl">No results created</h2>
      <p>
        Match results could not be created automatically because of match anomalies. Go
        back to match to fix anomalies, add results manually or close match without
        results.
      </p>
      <div className="flex gap-4">
        <ActionButton
          action={closeMatchSA}
          successMessage="Match closed without results"
          errorMessage="Failed to create results"
          kind="btn-primary"
        >
          Close match
        </ActionButton>
        <Link href={`/matches/${match.id}`} className="btn btn-secondary">
          Go back to match
        </Link>
      </div>
      <div className="divider" />
      <AddResultForm match={match} />
    </section>
  );
}
