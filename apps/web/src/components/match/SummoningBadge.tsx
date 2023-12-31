'use client';
import { useMatch } from '@/state/MatchContext';
import { useMemo } from 'react';
import { PlayersRow } from '@bf2-matchmaking/types';

interface Props {
  player: PlayersRow;
}
export default function SummoningBadge({ player }: Props) {
  const { room } = useMatch();
  const isActive = useMemo(() => room.activePlayers.includes(player.id), [room]);
  if (isActive) {
    return (
      <div className="tooltip" data-tip="Active">
        <div className="w-2 h-8 bg-success mr-4" />
      </div>
    );
  }
  return (
    <div className="tooltip" data-tip="Not connected">
      <div className="w-2 h-8 bg-error mr-4" />
    </div>
  );
}
