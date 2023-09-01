import { MatchesJoined, MatchResultsRow } from '@bf2-matchmaking/types';
import { getTeamRounds, getTeamTickets } from '@bf2-matchmaking/utils/src/results-utils';

interface Props {
  matchResult: MatchResultsRow;
}

export default function TeamStats({ matchResult }: Props) {
  return (
    <div className="flex gap-2 items-start justify-around">
      <div>
        <p className="font-extrabold text-5xl text-secondary">{`Team ${matchResult.team}`}</p>
        {matchResult.is_winner && (
          <div className="text-left text-xl font-bold text-success">Winner</div>
        )}
      </div>
      <div className="stats stats-horizontal shadow h-fit">
        <div className="stat">
          <div className="stat-title">Maps</div>
          <div className="stat-value">{matchResult.maps}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Rounds</div>
          <div className="stat-value">{matchResult.rounds}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Tickets</div>
          <div className="stat-value">{matchResult.tickets}</div>
        </div>
      </div>
    </div>
  );
}
