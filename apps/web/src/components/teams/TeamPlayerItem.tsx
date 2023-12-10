'use client';
import { PlayersRow, TeamsJoined } from '@bf2-matchmaking/types';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline, XCircleIcon } from '@heroicons/react/24/outline';
import IconBtn from '@/components/commons/IconBtn';
import { removeTeamPlayer, setTeamCaptain } from '@/app/teams/[team]/actions';

interface Props {
  team: TeamsJoined;
  player: PlayersRow & { captain: boolean };
}

export default function TeamPlayerItem({ player, team }: Props) {
  return (
    <li className="flex gap-1 items-center">
      <span className="text-lg">{player.nick}</span>
      {player.captain ? (
        <IconBtn
          Icon={StarIconSolid}
          size="xs"
          onClick={() => setTeamCaptain(team.id, player.id, false)}
        />
      ) : (
        <IconBtn
          Icon={StarIconOutline}
          size="xs"
          onClick={() => setTeamCaptain(team.id, player.id, true)}
        />
      )}
      <IconBtn
        Icon={XCircleIcon}
        size="xs"
        className="text-error"
        onClick={() => removeTeamPlayer(team.id, player.id)}
      />
    </li>
  );
}
