'use client';
import { useCallback } from 'react';
import { isString } from '@bf2-matchmaking/types';
import PlayerCombobox from '@/components/PlayerCombobox';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { addMatchPlayer } from '@/app/matches/[match]/actions';
import { usePlayer } from '@/state/PlayerContext';

interface Props {
  teamId: number;
  matchId: number;
}
export default function AddPlayerForm({ teamId, matchId }: Props) {
  const { isMatchAdmin } = usePlayer();
  const handleFormAction = useCallback(
    async (data: FormData) => {
      const value = data.get('player[id]');
      if (isString(value)) {
        await addMatchPlayer(matchId, value, teamId);
      }
    },
    [matchId, teamId]
  );

  return (
    <form action={handleFormAction} className="form-control">
      <div className="flex items-center gap-2">
        <PlayerCombobox placeholder="Empty slot" size="sm" disabled={!isMatchAdmin} />
        {isMatchAdmin && (
          <button
            type="submit"
            className="btn btn-sm btn-circle btn-ghost ml-auto text-success"
          >
            <PlusCircleIcon />
          </button>
        )}
      </div>
    </form>
  );
}
