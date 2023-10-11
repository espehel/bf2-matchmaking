'use client';
import { MatchesJoined, TeamsJoined } from '@bf2-matchmaking/types';
import { PlusIcon } from '@heroicons/react/24/solid';
import { Collapse } from 'react-collapse';
import { useCallback, useMemo, useState, useTransition } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { addMatchPlayer } from '@/app/matches/[match]/actions';

interface Props {
  match: MatchesJoined;
  team: TeamsJoined;
}

export default function AddTeamPlayerCollapsible({ match, team }: Props) {
  const [isOpened, setIsOpened] = useState(false);
  let [pending, startTransition] = useTransition();

  const handlePlayerAdd = useCallback(
    (playerId: string) => () => {
      startTransition(async () => {
        await addMatchPlayer(match.id, playerId, team.id);
      });
    },
    [match, team]
  );

  const players = useMemo(
    () => team.players.filter((p) => !match.teams.some((mp) => mp.player_id === p.id)),
    [match.teams, team.players]
  );

  if (players.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <hr className="separator" />
      <button
        className="btn btn-ghost btn-sm flex items-center justify-between"
        onClick={() => setIsOpened(!isOpened)}
      >
        <span>Team Players</span>
        <PlusIcon className="h-5" />
      </button>
      <Collapse isOpened={isOpened}>
        <ul>
          {players.map((player) => (
            <div key={player.id} className="flex items-center gap-2">
              <p>{player.full_name}</p>
              <button
                onClick={handlePlayerAdd(player.id)}
                className="btn btn-sm btn-circle btn-ghost ml-auto text-success"
                disabled={pending}
              >
                <PlusCircleIcon />
              </button>
            </div>
          ))}
        </ul>
      </Collapse>
    </div>
  );
}
