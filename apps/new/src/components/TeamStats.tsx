import { MatchesJoined } from '@bf2-matchmaking/types';
import { getTeamRounds, getTeamTickets } from '@bf2-matchmaking/utils/src/results-utils';

interface Props {
  team: 'a' | 'b';
  match: MatchesJoined;
  isWinner: boolean;
}

export default function TeamStats({ team, match, isWinner }: Props) {
  const tickets = getTeamTickets(match, team);
  const rounds = getTeamRounds(match, team);

  return (
    <div className="stats stats-vertical shadow h-fit">
      <div className="stat">
        <div className="stat-title">Tickets</div>
        <div className="stat-value">{tickets}</div>
        {isWinner && <div className="stat-desc text-success">Winner</div>}
      </div>
      <div className="stat">
        <div className="stat-title">Rounds</div>
        <div className="stat-value">{rounds}</div>
      </div>
    </div>
  );
}
