'use client';

import ActionButton from '@/components/ActionButton';
import { useServerRestart } from '@/state/server-hooks';
import { LiveServer } from '@bf2-matchmaking/types/server';

interface Props {
  matchId: number;
  server: LiveServer;
}

export function RestartServerButton({ matchId, server }: Props) {
  const [isRestarting, handleRestartServerAction] = useServerRestart(matchId, server);

  return (
    <ActionButton
      action={handleRestartServerAction}
      errorMessage="Failed to restart server"
      successMessage="Restarting server"
      disabled={isRestarting}
    >
      {isRestarting ? 'Server is restarting...' : 'Restart server'}
    </ActionButton>
  );
}
