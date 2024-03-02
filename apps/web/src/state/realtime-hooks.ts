import { MatchStatus, MatchesJoined, MatchServer } from '@bf2-matchmaking/types';
import { supabaseRealtime } from '@/lib/supabase/supabase-client';
import { usePlayer } from '@/state/PlayerContext';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@bf2-matchmaking/utils';

export function useMatchRoom(match: MatchesJoined, server: MatchServer | null) {
  const { player } = usePlayer();
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = searchParams?.get('player') || player?.id;

  const realtime = supabaseRealtime();
  const [activePlayers, setActivePlayers] = useState<Array<string>>([]);

  const launchBF2 = useCallback(() => {
    if (server?.server?.ip && player?.beta_tester) {
      api
        .live()
        .getServer(server.server.ip)
        .then(({ data }) => {
          if (data) {
            window.open(data.joinmeDirect, '_blank');
          }
        });
    }
  }, [server?.server?.ip && player?.beta_tester]);

  useEffect(() => {
    realtime.getRealtimeMatch(match, playerId).then((realtimeMatch) => {
      realtimeMatch.listenActivePlayers((players) => {
        setActivePlayers(players);
      });

      realtimeMatch.listenStatusUpdate((status) => {
        if (status === MatchStatus.Ongoing) {
          launchBF2();
        }
        router.refresh();
      });
    });

    return () => {
      realtime.leaveRealtimeMatch(match);
    };
  }, [match.id, launchBF2, playerId]);

  return { activePlayers };
}
