'use-client';
import { FetchResult, LiveServer } from '@bf2-matchmaking/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { restartServer } from '@/app/matches/[match]/actions';

export function useServerRestart(
  matchId: number,
  server: LiveServer | null
): [boolean, () => Promise<FetchResult<unknown>>] {
  const router = useRouter();
  const [isRestarting, setRestarting] = useState(false);
  const [isRestarted, setRestarted] = useState(true);

  const handleRestartServerAction = useCallback(() => {
    setRestarting(true);
    setRestarted(false);
    setTimeout(() => {
      router.refresh();
      setRestarted(true);
    }, 15000);
    return restartServer(matchId, server?.address || '');
  }, [matchId, server, router]);

  useEffect(() => {
    if (isRestarting && isRestarted && server?.live) {
      setRestarting(false);
    }
  }, [isRestarted, isRestarting, server]);

  return [isRestarting, handleRestartServerAction];
}
