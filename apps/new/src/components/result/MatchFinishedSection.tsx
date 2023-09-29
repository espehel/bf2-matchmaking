import { MatchesJoined } from '@bf2-matchmaking/types';
import Link from 'next/link';
import { closeMatch } from '@/app/results/[match]/actions';
import AsyncActionButton from '@/components/AsyncActionButton';

interface Props {
  match: MatchesJoined;
}

export default function MatchFinishedSection({ match }: Props) {
  return (
    <div>
      <p>
        Match results could not be created manually. There could be errors with the match.
        Go to match to fix errors or close match to create results:
      </p>
      <AsyncActionButton
        action={() => closeMatch(match.id)}
        successMessage="Match closed and results created."
        errorMessage="Failed to create results"
        kind="btn-primary"
      >
        Close match
      </AsyncActionButton>
      <Link href={`/matches/${match.id}`} className="btn btn-secondary">
        Go to match
      </Link>
    </div>
  );
}
