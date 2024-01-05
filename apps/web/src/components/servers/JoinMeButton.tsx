'use client';
import { RconBf2Server } from '@bf2-matchmaking/types';
import { useCallback } from 'react';

interface Props {
  server: RconBf2Server;
}

export default function JoinMeButton({ server }: Props) {
  const handleClick = useCallback(() => {
    window.open(server.joinmeDirect, '_blank');
  }, [server]);

  return (
    <button className="btn btn-primary mt-4" onClick={handleClick}>
      Join server
    </button>
  );
}
