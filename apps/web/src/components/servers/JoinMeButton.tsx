'use client';
import { useCallback } from 'react';
import { ConnectedLiveServer } from '@bf2-matchmaking/types/server';

interface Props {
  server: ConnectedLiveServer;
  disabled?: boolean;
}

export default function JoinMeButton({ server, disabled }: Props) {
  const handleClick = useCallback(() => {
    window.open(server.data.joinmeDirect, '_blank');
  }, [server]);

  return (
    <button className="btn btn-secondary" onClick={handleClick} disabled={disabled}>
      Join server
    </button>
  );
}
