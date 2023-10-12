'use client';
import { createContext, useContext, useMemo, ReactNode } from 'react';
import { MatchesJoined } from '@bf2-matchmaking/types';
import { assertObj, isCaptain, isTeamCaptain } from '@bf2-matchmaking/utils';
import { usePlayer } from '@/state/PlayerContext';

type ContextValue = { match: MatchesJoined; isMatchOfficer: boolean };

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

  const context = useMemo<ContextValue>(
    () => ({
      match,
      isMatchOfficer,
    }),
    [match, isMatchOfficer]
  );
  return <MatchContext.Provider value={context}>{children}</MatchContext.Provider>;
}

export function useMatch() {
  const context = useContext(MatchContext);
  assertObj(context, 'useMatch must be used inside a MatchProvider');
  return context;
}
