import {
  MatchesJoined,
  MatchStatus,
  PlayerListItem,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { removeMatchPlayer } from '@/app/matches/[match]/actions';
import { XCircleIcon } from '@heroicons/react/24/outline';
import TeamPlayerActionButton from '@/components/TeamPlayerActionButton';
import { StarIcon } from '@heroicons/react/20/solid';

interface Props {
  player: PlayersRow;
  playerInfo: PlayerListItem | undefined;
  match: MatchesJoined;
  team: number;
  captains: Array<string>;
}
export default function PlayerItem({ player, playerInfo, match, team, captains }: Props) {
  const expectedTeam = match.home_team.id === team ? '2' : '1';

  const isCaptain = captains.includes(player.id);

  const removeMatchPlayerSA = async () => {
    'use server';
    return removeMatchPlayer(match.id, player.id);
  };

  return (
    <li className="flex gap-2 items-center w-52">
      <PlayerBadge
        player={player}
        playerInfo={playerInfo}
        match={match}
        expectedTeam={expectedTeam}
      />
      <div className="flex items-center m-1 truncate">
        {player.full_name}
        {isCaptain && <StarIcon height={16} viewBox="0 2 20 20" />}
      </div>
      <TeamPlayerActionButton
        action={removeMatchPlayerSA}
        errorMessage={`Failed to remove ${player.full_name}`}
        successMessage={`Removed ${player.full_name}`}
      >
        <XCircleIcon className="text-error" />
      </TeamPlayerActionButton>
    </li>
  );
}
interface PlayerBadgeProps {
  player: PlayersRow;
  playerInfo?: PlayerListItem;
  match: MatchesJoined;
  expectedTeam: '1' | '2';
}
async function PlayerBadge({
  player,
  playerInfo,
  match,
  expectedTeam,
}: PlayerBadgeProps) {
  if (!player.keyhash) {
    return (
      <div className="tooltip" data-tip="Not registered">
        <div className="w-2 h-8 bg-ghost mr-4" />
      </div>
    );
  }

  if (match.status !== MatchStatus.Ongoing) {
    return (
      <div className="tooltip" data-tip="Not ongoing">
        <div className="w-2 h-8 bg-info mr-4" />
      </div>
    );
  }

  if (!playerInfo) {
    return (
      <div className="tooltip" data-tip="Not connected">
        <div className="w-2 h-8 bg-error mr-4" />
      </div>
    );
  }

  if (expectedTeam !== playerInfo.getTeam) {
    return (
      <div className="tooltip flex gap-2 items-center" data-tip="Wrong team">
        <div className="w-2 h-8 bg-warning" />
        <div className="w-3">{playerInfo.index}</div>
      </div>
    );
  }

  return (
    <div className="tooltip flex gap-2 items-center" data-tip="Ready">
      <div className="w-2 h-8 bg-success" />
      <div className="w-3">{playerInfo.index}</div>
    </div>
  );
}
