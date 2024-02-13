'use client';
import { LiveServer } from '@bf2-matchmaking/types';
import { useCallback } from 'react';

interface Props {
  server: LiveServer;
}

export default function JoinMeButton({ server }: Props) {
  const handleClick = useCallback(() => {
    window.open(server.joinmeDirect, '_blank');
  }, [server]);

  return (
    <button className="btn btn-primary" onClick={handleClick}>
      Join server
    </button>
  );
}
