'use client';
import { useCallback } from 'react';
import { LiveServer } from '@bf2-matchmaking/types/server';
import { isConnectedLiveServer } from '@bf2-matchmaking/types';
import { ServerStackIcon } from '@heroicons/react/24/solid';

interface Props {
  server: LiveServer;
  disabled?: boolean;
}

export default function JoinMeLink({ server, disabled }: Props) {
  const handleClick = useCallback(() => {
    if (isConnectedLiveServer(server)) {
      window.open(server.data.joinmeDirect, '_blank');
    }
  }, [server]);

  if (!isConnectedLiveServer(server)) {
    return <span className="text-accent">{server.address}</span>;
  }
  return (
    <button
      className="link link-hover link-accent"
      onClick={handleClick}
      disabled={disabled}
    >
      <ServerStackIcon className="size-4" />
      {server.address}:{server.data.port}
    </button>
  );
}
