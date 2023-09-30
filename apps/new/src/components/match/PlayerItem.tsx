'use client';
import {
  MatchesJoined,
  MatchPlayersRow,
  PlayerListItem,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { useMemo } from 'react';
import { getTeamMap } from '@bf2-matchmaking/utils/src/results-utils';

interface Props {
  mp: MatchPlayersRow;
  match: MatchesJoined;
  playerList: PlayerListItem[];
  team: number;
}
type PlayerMatchStatus = 'unregistered' | 'unconnected' | 'unteamed' | 'ok';
export default function PlayerItem({ mp, match, playerList, team }: Props) {
  const player = useMemo(
    () => match.players.find(({ id }) => id === mp.player_id),
    [match, mp]
  );
  const info = useMemo(
    () => playerList.find((p) => p.keyhash === player?.keyhash),
    [playerList, player]
  );

  const status = useMemo<PlayerMatchStatus>(() => {
    if (!player?.keyhash) {
      return 'unregistered';
    }
    if (!info) {
      return 'unconnected';
    }
    if (team !== getTeamMap(match.rounds.length)[info.getTeam]) {
      return 'unteamed';
    }
    return 'ok';
  }, [player, info, team, match]);

  const username = useMemo(
    () =>
      player
        ? player.username
        : `Player ${match.teams.findIndex(
            ({ player_id }) => mp.player_id === player_id
          )}`,
    [player, match, mp]
  );

  return (
    <li className="flex gap-2 items-center">
      <PlayerBadge status={status} />
      <div className="mb-1">{username}</div>
    </li>
  );
}
interface PlayerBadgeProps {
  status: PlayerMatchStatus;
}
function PlayerBadge({ status }: PlayerBadgeProps) {
  if (status === 'unregistered') {
    return (
      <div className="tooltip" data-tip="Not registered">
        <div className="badge badge-ghost badge-sm" />
      </div>
    );
  }
  if (status === 'unconnected') {
    return (
      <div className="tooltip" data-tip="Not connected">
        <div className="badge badge-error badge-sm" />
      </div>
    );
  }
  if (status === 'unteamed') {
    return (
      <div className="tooltip" data-tip="Wrong team">
        <div className="badge badge-warning badge-sm" />
      </div>
    );
  }
  if (status === 'ok') {
    return (
      <div className="tooltip" data-tip="Ready">
        <div className="badge badge-success badge-sm" />
      </div>
    );
  }
}
