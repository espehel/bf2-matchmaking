'use client';
import { MatchesJoined, MatchTeam } from '@bf2-matchmaking/types';
import { useMemo } from 'react';
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { addMatchPlayer } from '@/app/matches/[match]/actions';
import TeamPlayerActionButton from '@/components/TeamPlayerActionButton';

interface Props {
  match: MatchesJoined;
  team: MatchTeam;
}

export default function TeamPlayersList({ match, team }: Props) {
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
      <div className="divider">Team Players</div>
      <ul>
        {players.map(({ player }) => (
          <div key={player.id} className="flex items-center gap-2">
            <p>{player.nick}</p>
            <TeamPlayerActionButton
              action={() => addMatchPlayer(match.id, player.id, team.id, match.config.id)}
              successMessage={`Added ${player.nick}`}
              errorMessage={`Failed to add ${player.nick}`}
            >
              <PlusCircleIcon className="text-success" />
            </TeamPlayerActionButton>
          </div>
        ))}
      </ul>
    </div>
  );
}
