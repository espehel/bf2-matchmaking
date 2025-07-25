'use client';
import { useCallback } from 'react';
import { isString } from '@bf2-matchmaking/types';
import PlayerCombobox from '@/components/PlayerCombobox';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { addMatchPlayer } from '@/app/matches/[match]/actions';
import { useFormStatus } from 'react-dom';
import { toast } from 'react-toastify';
import { useMatch } from '@/state/MatchContext';

interface Props {
  teamId?: number;
  matchId: number;
  config: number;
  label?: string;
}
export default function AddPlayerForm({ teamId, matchId, config, label }: Props) {
  const { isMatchOfficer } = useMatch();
  const handleFormAction = useCallback(
    async (data: FormData) => {
      const value = data.get('player[id]');
      const name = data.get('player[nick]');
      if (isString(value)) {
        const { error } = await addMatchPlayer(matchId, value, teamId, config);
        if (error) {
          toast.error(`Failed to add player ${name}`);
        } else {
          toast.success(`Added player ${name}`);
        }
      }
    },
    [matchId, teamId, config]
  );

  return (
    <form action={handleFormAction} className=" flex flex-col">
      <div className="flex items-center gap-2">
        <PlayerCombobox
          placeholder={label || 'Empty slot'}
          size="sm"
          disabled={!isMatchOfficer}
        />
        {isMatchOfficer && <SubmitButton />}
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="btn btn-sm btn-circle btn-ghost ml-auto text-success"
      disabled={pending}
    >
      {pending ? (
        <div className="loading loading-spinner loading-sm" />
      ) : (
        <PlusCircleIcon />
      )}
    </button>
  );
}
