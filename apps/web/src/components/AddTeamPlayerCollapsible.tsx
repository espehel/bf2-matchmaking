'use client';
import { MatchesJoined, MatchTeam } from '@bf2-matchmaking/types';
import { PlusIcon } from '@heroicons/react/24/solid';
import { Collapse } from 'react-collapse';
import { useMemo, useState } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { addMatchPlayer } from '@/app/matches/[match]/actions';
import TeamPlayerActionButton from '@/components/TeamPlayerActionButton';

interface Props {
  match: MatchesJoined;
  team: MatchTeam;
}

export default function AddTeamPlayerCollapsible({ match, team }: Props) {
  const [isOpened, setIsOpened] = useState(false);

  const players = useMemo(
    () =>
      team.players.filter((p) => !match.teams.some((mp) => mp.player_id === p.player_id)),
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
          {players.map(({ player }) => (
            <div key={player.id} className="flex items-center gap-2">
              <p>{player.nick}</p>
              <TeamPlayerActionButton
                action={() =>
                  addMatchPlayer(match.id, player.id, team.id, match.config.id)
                }
                successMessage={`Added ${player.nick}`}
                errorMessage={`Failed to add ${player.nick}`}
              >
                <PlusCircleIcon className="text-success" />
              </TeamPlayerActionButton>
            </div>
          ))}
        </ul>
      </Collapse>
    </div>
  );
}
