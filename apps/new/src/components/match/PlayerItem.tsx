'use client';
import { MatchesJoined, MatchPlayersRow, PlayerListItem } from '@bf2-matchmaking/types';
import { useMemo } from 'react';
import { removeMatchPlayer } from '@/app/matches/[match]/actions';
import { XCircleIcon } from '@heroicons/react/24/outline';
import { usePlayer } from '@/state/PlayerContext';

interface Props {
  mp: MatchPlayersRow;
  match: MatchesJoined;
  playerList: PlayerListItem[];
  team: number;
}
type PlayerMatchStatus = 'unregistered' | 'unconnected' | 'unteamed' | 'ok';
export default function PlayerItem({ mp, match, playerList, team }: Props) {
  const { isMatchAdmin } = usePlayer();
  const player = useMemo(
    () => match.players.find(({ id }) => id === mp.player_id),
    [match, mp]
  );
  const info = useMemo(
    () => playerList.find((p) => p.keyhash === player?.keyhash),
    [playerList, player]
  );

  const status = useMemo<PlayerMatchStatus>(() => {
    const expectedTeam = match.home_team.id === team ? '2' : '1';

    if (!player?.keyhash) {
      return 'unregistered';
    }
    if (!info) {
      return 'unconnected';
    }
    if (expectedTeam !== info.getTeam) {
      return 'unteamed';
    }
    return 'ok';
  }, [player, info, team, match]);

  const username = useMemo(
    () =>
      player
        ? player.full_name
        : `Player ${match.teams.findIndex(
            ({ player_id }) => mp.player_id === player_id
          )}`,
    [player, match, mp]
  );

  return (
    <li className="flex gap-2 items-center w-52">
      <PlayerBadge status={status} />
      <div className="mb-1 truncate">{username}</div>
      {isMatchAdmin && (
        <button
          className="btn btn-sm btn-circle btn-ghost ml-auto"
          onClick={() => removeMatchPlayer(mp)}
        >
          <XCircleIcon className="text-error" />
        </button>
      )}
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
