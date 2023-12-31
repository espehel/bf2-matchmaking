'use client';
import { createContext, useContext, useMemo, ReactNode } from 'react';
import { MatchesJoined } from '@bf2-matchmaking/types';
import { assertObj, isCaptain, isTeamCaptain } from '@bf2-matchmaking/utils';
import { usePlayer } from '@/state/PlayerContext';
import { useMatchRoom } from '@/state/realtime-hooks';

type ContextValue = {
  match: MatchesJoined;
  isMatchOfficer: boolean;
  isMatchPlayer: boolean;
  room: ReturnType<typeof useMatchRoom>;
};

const MatchContext = createContext<ContextValue>({} as any);

interface Props {
  children: ReactNode;
  match: MatchesJoined;
}
export function MatchProvider({ children, match }: Props) {
  const { isMatchAdmin, player } = usePlayer();

  const isMatchOfficer = useMemo(() => {
    if (isMatchAdmin) {
      return true;
    }
    if (!player) {
      return false;
    }
    return isCaptain(match, player) || isTeamCaptain(match, player);
  }, [match, player, isMatchAdmin]);

  const isMatchPlayer = useMemo(
    () => Boolean(player && match.teams.some((mp) => mp.player_id === player?.id)),
    [match, player]
  );

  const room = useMatchRoom(match);

  const context = useMemo<ContextValue>(
    () => ({
      match,
      isMatchOfficer,
      isMatchPlayer,
      room,
    }),
    [match, isMatchOfficer, isMatchPlayer, room]
  );
  return <MatchContext.Provider value={context}>{children}</MatchContext.Provider>;
}

export function useMatch() {
  const context = useContext(MatchContext);
  assertObj(context, 'useMatch must be used inside a MatchProvider');
  return context;
}
