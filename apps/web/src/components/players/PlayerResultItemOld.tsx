import { MatchResultsRow, PlayerResultsJoined } from '@bf2-matchmaking/types';
import { calculateMatchTeamRating } from '@bf2-matchmaking/utils';
import CardListItem from '@/components/commons/CardListItem';
import classNames from 'classnames';
import { DateTime } from 'luxon';

interface Props {
  playerResult: PlayerResultsJoined;
}

export default function PlayerResultItemOld({ playerResult }: Props) {
  const { match, created_at, team, rating_inc, player_id, match_id } = playerResult;
  const [homeResults, awayResults] = getMatchResultTuple(
    match.home_team.id,
    match.away_team.id,
    match.results
  );
  const winnerId = homeResults?.is_winner
    ? match.home_team.id
    : awayResults?.is_winner
    ? match.away_team.id
    : null;
  const playerOutcome = winnerId === null ? 'Draw' : winnerId === team ? 'Win' : 'Lose';
  const rating = match.players.find((p) => p.player_id === player_id)?.rating;
  const playerTeam = match.home_team.id === team ? match.home_team : match.away_team;

  const outcomeClasses = classNames('stat', {
    'text-success': playerOutcome === 'Win',
    'text-error': playerOutcome === 'Lose',
  });

  return (
    <CardListItem href={`/results/${match_id}`}>
      <div className="flex items-center gap-8">
        <div className={outcomeClasses}>
          <div className="stat-title capitalize">{playerOutcome}</div>
          <div className="stat-value">{`${rating} ${
            rating_inc && rating_inc > 0 ? '+' : ''
          }${rating_inc}`}</div>
          <div className="stat-desc">Team {playerTeam.name}</div>
        </div>
        <div className="stat">
          <div className="stat-title capitalize">{match.config.type}</div>
          <div className="stat-value">{match.config.name}</div>
          <div className="stat-desc">
            {DateTime.fromISO(created_at).toFormat('LLLL d, T')}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Team {match.home_team.name}</div>
          <div className="stat-value">{homeResults?.tickets}</div>
          <div className="stat-desc">
            {calculateMatchTeamRating(match.players, match.home_team.id)}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Team {match.away_team.name}</div>
          <div className="stat-value">{awayResults?.tickets}</div>
          <div className="stat-desc">
            {calculateMatchTeamRating(match.players, match.away_team.id)}
          </div>
        </div>
      </div>
    </CardListItem>
  );
}

function getMatchResultTuple(
  homeTeam: number,
  awayTeam: number,
  results: Array<MatchResultsRow>
) {
  return [
    results.find((r) => r.team === homeTeam),
    results.find((r) => r.team === awayTeam),
  ];
}
