import { FetchResult } from '@bf2-matchmaking/utils';

('use-client');
import { MatchesJoined, RconBf2Server } from '@bf2-matchmaking/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { restartServer } from '@/app/matches/[match]/actions';

export function useServerRestart(
  match: MatchesJoined,
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
    return restartServer(match.id, server?.ip || '');
  }, [match, server, router]);

  useEffect(() => {
    if (isRestarting && isRestarted && server?.info) {
      setRestarting(false);
    }
  }, [isRestarted, isRestarting, server]);

  return [isRestarting, handleRestartServerAction];
}
