import {
  MatchesJoined,
  MatchPlayersRow,
  MatchStatus,
  PlayerListItem,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { removeMatchPlayer } from '@/app/matches/[match]/actions';
import { XCircleIcon } from '@heroicons/react/24/outline';
import TeamPlayerActionButton from '@/components/TeamPlayerActionButton';
import { api } from '@bf2-matchmaking/utils';
import { Suspense } from 'react';
import { StarIcon } from '@heroicons/react/20/solid';

interface Props {
  mp: MatchPlayersRow;
  match: MatchesJoined;
  team: number;
  captains: Array<string>;
}
export default async function PlayerItem({ mp, match, team, captains }: Props) {
  const player = match.players.find(({ id }) => id === mp.player_id);
  const expectedTeam = match.home_team.id === team ? '2' : '1';

  const username = player
    ? player.full_name
    : `Player ${match.teams.findIndex(({ player_id }) => mp.player_id === player_id)}`;

  const isCaptain = captains.includes(mp.player_id);

  const removeMatchPlayerSA = async () => {
    'use server';
    return removeMatchPlayer(mp);
  };

  return (
    <li className="flex gap-2 items-center mb-1 w-52">
      <Suspense fallback={<span className="loading loading-ring loading-xs"></span>}>
        <PlayerBadge player={player} match={match} expectedTeam={expectedTeam} />
      </Suspense>
      <div className="flex items-center mb-1 truncate">
        {username}
        {isCaptain && <StarIcon height={16} viewBox="0 2 20 20" />}
      </div>
      <TeamPlayerActionButton
        action={removeMatchPlayerSA}
        errorMessage={`Failed to remove ${username}`}
        successMessage={`Removed ${username}`}
      >
        <XCircleIcon className="text-error" />
      </TeamPlayerActionButton>
    </li>
  );
}
interface PlayerBadgeProps {
  player?: PlayersRow;
  match: MatchesJoined;
  expectedTeam: '1' | '2';
}
async function PlayerBadge({ player, match, expectedTeam }: PlayerBadgeProps) {
  if (!player?.keyhash) {
    return (
      <div className="tooltip" data-tip="Not registered">
        <div className="badge badge-ghost badge-sm" />
      </div>
    );
  }

  if (match.status !== MatchStatus.Ongoing) {
    return (
      <div className="tooltip" data-tip="Not ongoing">
        <div className="badge badge-info badge-sm" />
      </div>
    );
  }

  const info = await fetchPlayerInfo(match, player);
  if (!info) {
    return (
      <div className="tooltip" data-tip="Not connected">
        <div className="badge badge-error badge-sm" />
      </div>
    );
  }

  if (expectedTeam !== info.getTeam) {
    return (
      <div className="tooltip" data-tip="Wrong team">
        <div className="badge badge-warning badge-sm" />
      </div>
    );
  }

  return (
    <div className="tooltip" data-tip="Ready">
      <div className="badge badge-success badge-sm" />
    </div>
  );
}

async function fetchPlayerInfo(
  match: MatchesJoined,
  player?: PlayersRow
): Promise<PlayerListItem | null> {
  if (match.server && player) {
    const { data } = await api.rcon().getServerPlayerList(match.server.ip);
    if (data) {
      return data.find((p) => p.keyhash === player.keyhash) || null;
    }
  }
  return null;
}
