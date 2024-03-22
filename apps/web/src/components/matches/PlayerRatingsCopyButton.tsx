'use client';
import { PlayersRow } from '@bf2-matchmaking/types';
import copy from 'copy-text-to-clipboard';
import { ClipboardIcon } from '@heroicons/react/24/outline';
import { useCallback } from 'react';
import { toast } from 'react-toastify';

type PlayerTuple = [PlayersRow, number | undefined, number | undefined];

interface Props {
  players: Array<PlayerTuple>;
}

export default function PlayerRatingsCopyButton({ players }: Props) {
  const handleClick = useCallback(() => {
    const text = players
      .map(([p, r, nr]) => {
        return `${p.id}\t${p.nick}\t${r || ''}\t${nr || ''}`;
      })
      .join('\n');
    copy('Id\tNick\tRating\tNext rating\n'.concat(text));
    toast.info('Copied player ratings to clipboard');
  }, [players]);

  return (
    <button className="btn btn-secondary" onClick={handleClick}>
      <span>Copy table</span>
      <ClipboardIcon className="inline-block h-5" />
    </button>
  );
}
