'use client';
import { LiveServer } from '@bf2-matchmaking/types';
import { useCallback } from 'react';

interface Props {
  server: LiveServer;
  disabled?: boolean;
}

export default function JoinMeButton({ server, disabled }: Props) {
  const handleClick = useCallback(() => {
    window.open(server.joinmeDirect, '_blank');
  }, [server]);

  return (
    <button className="btn btn-secondary" onClick={handleClick} disabled={disabled}>
      Join server
    </button>
  );
}
