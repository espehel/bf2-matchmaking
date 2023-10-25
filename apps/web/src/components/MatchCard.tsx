'use client';
import { MatchesJoined } from '@bf2-matchmaking/types';
import moment from 'moment';
import { useFirstRenderDefault } from '@/state/ssr-hooks';

interface Props {
  match: MatchesJoined;
}

export default function MatchCard({ match }: Props) {
  const isMix = match.home_team.id === 1 && match.away_team.id === 2;
  const matchTime = moment(match.scheduled_at || match.started_at).format('HH:mm');
  const matchDate = moment(match.scheduled_at || match.started_at).format(
    'dddd, MMMM Do'
  );
  return (
    <section className="px-8 border-2 border-primary rounded bg-base-100">
      {!isMix && (
        <>
          <div className="mt-3 text-left font-bold text-lg text-accent">{`${match.home_team.name} vs ${match.away_team.name}`}</div>
          <div className="divider divider-vertical m-0" />
        </>
      )}
      <div className="flex items-center gap-8">
        <div className="stat">
          <div className="stat-title">{match.config.name}</div>
          <div className="stat-value capitalize">{matchTime}</div>
          <div className="stat-desc">{matchDate}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Match status</div>
          <div className="stat-value">{match.status}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Rounds played</div>
          <div className="stat-value">{match.rounds.length}</div>
        </div>
      </div>
    </section>
  );
}
