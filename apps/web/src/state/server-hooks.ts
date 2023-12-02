'use-client';
import { FetchResult } from '@bf2-matchmaking/utils';
import { MatchesJoined, RconBf2Server } from '@bf2-matchmaking/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { restartServer } from '@/app/matches/[match]/actions';

export function useServerRestart(
  matchId: number,
  server: RconBf2Server | null
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
    return restartServer(matchId, server?.ip || '');
  }, [matchId, server, router]);

  useEffect(() => {
    if (isRestarting && isRestarted && server?.info) {
      setRestarting(false);
    }
  }, [isRestarted, isRestarting, server]);

  return [isRestarting, handleRestartServerAction];
}
