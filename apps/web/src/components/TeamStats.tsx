import { MatchResultsJoined } from '@bf2-matchmaking/types';

interface Props {
  matchResult: MatchResultsJoined;
}

export default function TeamStats({ matchResult }: Props) {
  return (
    <div className="flex flex-col gap-2 items-center justify-around">
      <p className="font-extrabold text-5xl text-secondary">{`Team ${matchResult.team.name}`}</p>
      <div className="stats stats-horizontal shadow h-fit">
        {matchResult.rating_inc !== null && (
          <div className="stat bg-primary text-primary-content">
            <div className="stat-title text-primary-content">Score</div>
            <div className="stat-value">{matchResult.rating_inc}</div>
          </div>
        )}
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
      {matchResult.is_winner ? (
        <div className="text-left text-xl font-bold text-success">Winner</div>
      ) : (
        <div className="h-7" />
      )}
    </div>
  );
}
