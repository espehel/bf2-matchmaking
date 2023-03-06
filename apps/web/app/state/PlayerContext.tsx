import { createContext, FC, PropsWithChildren, useContext, useMemo } from 'react';
import { MatchesJoined, MatchPlayersRow, PlayersRow } from '@bf2-matchmaking/types';
import invariant from 'tiny-invariant';

interface PlayerContextValue {
  player: PlayersRow | null;
  isMatchPlayer: (match: MatchesJoined) => boolean;
  getMatchPlayer: (match: MatchesJoined) => MatchPlayersRow | undefined;
}
const PlayerContext = createContext<PlayerContextValue>({} as any);
interface Props {
  player: PlayersRow | null;
}
export const PlayerContextProvider: FC<PropsWithChildren<Props>> = ({ children, player }) => {
  const isMatchPlayer = (match: MatchesJoined) =>
    player ? match.teams.some((p) => p.player_id === player.id) : false;

  const getMatchPlayer = (match: MatchesJoined) =>
    player ? match.teams.find((p) => p.player_id === player.id) : undefined;

  const contextValue = useMemo(
    () => ({ player, isMatchPlayer, getMatchPlayer }),
    [player, isMatchPlayer, getMatchPlayer]
  );

  return <PlayerContext.Provider value={contextValue}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  invariant(context, 'usePlayer must be used inside PlayerContextProvider');
  return context;
};
