'use client';
import { isScheduledMatch, MatchesJoined } from '@bf2-matchmaking/types';
import copy from 'copy-text-to-clipboard';
import { toRaidOrganizerCommand } from '@bf2-matchmaking/utils';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';

interface Props {
  match: MatchesJoined;
}

export default function OrganizerCommandCopyButton({ match }: Props) {
  const command = useMemo(
    () => (isScheduledMatch(match) ? toRaidOrganizerCommand(match) : undefined),
    [match]
  );

  const handleClick = useCallback(() => {
    if (command) {
      copy(command);
      toast.info('Copied Raid-Organizer command to clipboard');
    }
  }, [command]);

  if (!command) {
    return null;
  }

  return (
    <div className="tooltip tooltip-info" data-tip={command}>
      <button className="btn btn-secondary" onClick={handleClick}>
        <span>Organizer command</span>
        <ClipboardIcon className="inline-block h-5" />
      </button>
    </div>
  );
}
