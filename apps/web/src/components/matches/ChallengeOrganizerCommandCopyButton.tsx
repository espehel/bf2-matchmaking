'use client';
import { AcceptedChallenge, MatchesJoined } from '@bf2-matchmaking/types';
import copy from 'copy-text-to-clipboard';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { buildRaidOrganizerCommand } from '@bf2-matchmaking/utils';

interface Props {
  match: MatchesJoined;
  challenge: AcceptedChallenge;
}

export default function ChallengeOrganizerCommandCopyButton({ match, challenge }: Props) {
  const command = useMemo(
    () => buildRaidOrganizerCommand(match, challenge),
    [match, challenge]
  );
  const handleClick = useCallback(() => {
    copy(command);
    toast.info('Copied Raid-Organizer command to clipboard');
  }, [command]);

  return (
    <div className="tooltip tooltip-info" data-tip={command}>
      <button className="btn btn-secondary" onClick={handleClick}>
        <span>Organizer command</span>
        <ClipboardIcon className="inline-block h-5" />
      </button>
    </div>
  );
}
