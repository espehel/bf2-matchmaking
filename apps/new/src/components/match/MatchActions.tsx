'use client';
import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { closeMatch } from '@/app/matches/[match]/actions';
import { toast } from 'react-toastify';
import { useCallback } from 'react';

interface Props {
  match: MatchesJoined;
}

export default function MatchActions({ match }: Props) {
  const handleCloseMatch = useCallback(async () => {
    const { error } = await closeMatch(match.id);
    if (error) {
      toast.error('Failed to close match.');
    } else {
      toast.success(`Match ${match.id} closed.`);
    }
  }, [match]);

  if (match.status === MatchStatus.Closed) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-4">
      <button className="btn btn-primary w-fit" onClick={handleCloseMatch}>
        Close match
      </button>
      <button className="btn btn-primary w-fit" disabled>
        Set server
      </button>
    </div>
  );
}
