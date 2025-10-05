'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { AdminRolesRow, PlayersRow } from '@bf2-matchmaking/types';
import { assertObj } from '@bf2-matchmaking/utils/assert';

type ContextValue = {
  isMatchAdmin: boolean;
  isPlayerAdmin: boolean;
  isServerAdmin: boolean;
  player: PlayersRow | null;
};

const PlayerContext = createContext<ContextValue>({} as any);

interface Props {
  children: ReactNode;
  player: PlayersRow | null;
  adminRoles: AdminRolesRow | null;
}
export function PlayerProvider({ children, player, adminRoles }: Props) {
  const context = useMemo<ContextValue>(
    () => ({
      isMatchAdmin: adminRoles?.match_admin ?? false,
      isPlayerAdmin: adminRoles?.player_admin ?? false,
      isServerAdmin: adminRoles?.server_admin ?? false,
      player,
    }),
    [adminRoles, player]
  );
  return <PlayerContext.Provider value={context}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  assertObj(context, 'usePlayer must be used inside a PlayerProvider');
  return context;
}
