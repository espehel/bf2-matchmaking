'use client';
import { MatchesJoined, MatchTeam } from '@bf2-matchmaking/types';
import { MouseEventHandler, useCallback, useMemo } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { addMatchPlayer } from '@/app/matches/[match]/actions';
import TeamPlayerActionButton from '@/components/TeamPlayerActionButton';
import { useLocalStorage } from '@/state/useLocalStorage';

interface Props {
  match: MatchesJoined;
  team: MatchTeam;
}

export default function TeamPlayersList({ match, team }: Props) {
  const [openState, setOpenState] = useLocalStorage('TeamPlayersList');
  const players = useMemo(
    () =>
      team.players.filter((p) => !match.teams.some((mp) => mp.player_id === p.player_id)),
    [match.teams, team.players]
  );

  const toggleOpenState = useCallback<MouseEventHandler<HTMLDetailsElement>>(
    (event) => {
      event.preventDefault();
      setOpenState(openState === 'open' ? 'closed' : 'open');
    },
    [openState, setOpenState]
  );

  if (players.length === 0) {
    return null;
  }

  return (
    <details
      className="collapse collapse-arrow mt-2"
      onClick={toggleOpenState}
      open={openState === 'open'}
    >
      <summary className="collapse-title">Team Players ({players.length})</summary>
      <div className="collapse-content px-0">
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
      </div>
    </details>
  );
}
