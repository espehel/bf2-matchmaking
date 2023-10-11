import React, { FC, useMemo } from 'react';
import { MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { FaCheckCircle } from 'react-icons/fa';
import { useUser } from '@supabase/auth-helpers-react';

interface Props {
  match: MatchesJoined;
}

const PlayersSection: FC<Props> = ({ match }) => {
  const playerCount = match.teams.length;
  const readyPlayers = match.teams.filter((p) => p.ready).map((p) => p.player_id);
  const user = useUser();

  const playerList = useMemo(() => {
    if (user) {
      return match.players.map((player) => [player.id, player.username]);
    }
    return match.teams.map((player, i) => [player.player_id, `Player ${i}`]);
  }, [user, match]);

  return (
    <section className="section grow">
      <h2 className="text-xl">
        Players({playerCount}/{match.config.size}):
      </h2>
      <ul>
        {playerList.map(([playerId, username]) => (
          <li key={playerId} className="flex gap-1 items-center">
            <p>{username}</p>
            {match.status === MatchStatus.Summoning && readyPlayers.includes(playerId) && (
              <FaCheckCircle className="text-green-600" />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default PlayersSection;
