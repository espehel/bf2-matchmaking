import { MatchesJoined } from '@bf2-matchmaking/types';
import { supabaseRealtime } from '@/lib/supabase/supabase-client';
import { usePlayer } from '@/state/PlayerContext';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function useMatchRoom(match: MatchesJoined) {
  const { player } = usePlayer();
  const searchParams = useSearchParams();
  const playerId = searchParams.get('player') || player?.id;

  const realtime = supabaseRealtime();
  const [activePlayers, setActivePlayers] = useState<Array<string>>([]);
  useEffect(() => {
    const { listenActivePlayers, join, leave } = realtime(match, playerId);
    join().then(() => {
      listenActivePlayers((players) => {
        setActivePlayers(players);
      });
    });
    return () => {
      leave();
    };
  }, [match.id, playerId]);
  return { activePlayers };
}
