'use client';
import { MatchesJoined } from '@bf2-matchmaking/types';
import { useFirstRenderDefault } from 'web/app/state/ssr-hooks';
import moment from 'moment';

interface Props {
  match: MatchesJoined;
}

export default function OngoingMatchCard({ match }: Props) {
  const startTime = useFirstRenderDefault(
    match.started_at && moment(match.started_at).format('hh:mm'),
    () => match.started_at && moment(match.started_at).format('LT')
  );

  return (
    <section className="flex items-center gap-8 px-8 border-2 border-primary rounded bg-base-100">
      <h2 className="text-xl">{`Match ${match.id}`}</h2>
      {startTime && (
        <div className="stat">
          <div className="stat-title">Started</div>
          <div className="stat-value">{startTime}</div>
        </div>
      )}
      <div className="stat">
        <div className="stat-title">Rounds played</div>
        <div className="stat-value">{match.rounds.length}</div>
      </div>
    </section>
  );
}
