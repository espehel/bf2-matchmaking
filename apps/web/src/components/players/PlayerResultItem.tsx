import { PlayerResultInfo, PlayerResultsJoined } from '@bf2-matchmaking/types';
import CardListItem from '@/components/commons/CardListItem';
import classNames from 'classnames';
import { DateTime } from 'luxon';

interface Props {
  playerResult: PlayerResultsJoined;
  info: PlayerResultInfo;
}

export default function PlayerResultItem({ playerResult, info }: Props) {
  const { created_at, rating_inc, match_id } = playerResult;

  const scoreLabel = info.score === 1 ? 'Win' : info.score === 0 ? 'Lose' : 'Draw';
  const outcomeClasses = classNames('stat', {
    'text-success': info.score === 1,
    'text-error': info.score === 0,
  });
  const ratingLabel = !rating_inc
    ? info.rating
    : rating_inc > 0
    ? `${info.rating} +${rating_inc}`
    : `${info.rating} ${rating_inc}`;

  return (
    <CardListItem href={`/results/${match_id}`}>
      <div className="flex items-center gap-8">
        <div className={outcomeClasses}>
          <div className="stat-title capitalize">{scoreLabel}</div>
          <div className="stat-value">{ratingLabel}</div>
          <div className="stat-desc">Team {info.playerTeam}</div>
        </div>
        <div className="stat">
          <div className="stat-title capitalize">{info.type}</div>
          <div className="stat-value">{info.name}</div>
          <div className="stat-desc">
            {DateTime.fromISO(created_at).toFormat('LLLL d, T')}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Team {info.homeTeam}</div>
          <div className="stat-value">{info.homeTeamTickets}</div>
          <div className="stat-desc">{info.homeTeamRating}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Team {info.awayTeam}</div>
          <div className="stat-value">{info.awayTeamTickets}</div>
          <div className="stat-desc">{info.awayTeamRating}</div>
        </div>
      </div>
    </CardListItem>
  );
}
