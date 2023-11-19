'use client';
import { useCallback } from 'react';
import { isString } from '@bf2-matchmaking/types';
import PlayerCombobox from '@/components/PlayerCombobox';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { usePlayer } from '@/state/PlayerContext';
import { addTeamPlayer } from '@/app/teams/[team]/actions';
import IconBtn from '@/components/commons/IconBtn';

interface Props {
  teamId: number;
  disabled?: boolean;
}
export default function AddPlayerForm({ teamId, disabled }: Props) {
  const handleFormAction = useCallback(
    async (data: FormData) => {
      const value = data.get('player[id]');
      if (isString(value)) {
        await addTeamPlayer(value, teamId);
      }
    },
    [teamId]
  );

  return (
    <form action={handleFormAction} className="form-control">
      <div className="flex items-center gap-2">
        <PlayerCombobox placeholder="Add player" disabled={disabled} />
        {!disabled && (
          <IconBtn
            type="submit"
            Icon={PlusCircleIcon}
            size="sm"
            className="ml-auto text-success"
          />
        )}
      </div>
    </form>
  );
}
