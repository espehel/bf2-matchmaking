'use client';
import { MatchesJoined } from '@bf2-matchmaking/types';
import { useState } from 'react';
import moment from 'moment';
import IconBtn from '@/components/commons/IconBtn';
import { PencilSquareIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { ArrowUpOnSquareIcon } from '@heroicons/react/24/outline';
// @ts-ignore
import { experimental_useFormStatus as useFormStatus } from 'react-dom';
import { useMatch } from '@/state/MatchContext';
import { updateMatchScheduledAt } from '@/app/matches/[match]/actions';

interface Props {
  match: MatchesJoined;
}

export default function ScheduledAt({ match }: Props) {
  const [edit, setEdit] = useState(false);
  const { isMatchOfficer } = useMatch();
  if (!match.scheduled_at) {
    return (
      <p className="text-gray font-bold">
        {moment(match.created_at).format('HH:mm - dddd Do MMMM')}
      </p>
    );
  }

  if (edit && isMatchOfficer) {
    return (
      <form
        action={(data) => updateMatchScheduledAt(match.id, data)}
        className="flex items-center"
      >
        <input
          name="dateInput"
          className="input input-bordered input-xs mr-2"
          placeholder="YYYY-MM-DD HH:mm"
        />
        <SubmitButton />
        <IconBtn
          size="xs"
          className="text-error"
          Icon={XMarkIcon}
          onClick={() => setEdit(false)}
        />
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1 text-gray font-bold">
      <span>{moment(match.scheduled_at).format('HH:mm - dddd Do MMMM')}</span>
      {/* TODO: reenable this with update of discord event
      isMatchOfficer && (
        <IconBtn size="xs" Icon={PencilSquareIcon} onClick={() => setEdit(true)} />
      )*/}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  if (pending) {
    return (
      <div className="w-6 h-6">
        <span className="loading loading-spinner"></span>
      </div>
    );
  }
  return (
    <button type="submit" className="btn btn-ghost btn-square btn-xs">
      <ArrowUpOnSquareIcon />
    </button>
  );
}
