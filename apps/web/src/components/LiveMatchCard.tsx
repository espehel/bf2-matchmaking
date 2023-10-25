'use client';
import { LiveInfo, LiveServerState, MatchesJoined } from '@bf2-matchmaking/types';
import moment from 'moment';

interface Props {
  match: MatchesJoined;
  liveInfo: LiveInfo | null;
  liveState: LiveServerState;
}

export default function LiveMatchCard({ match, liveInfo, liveState }: Props) {
  const isMix = match.home_team.id === 1 && match.away_team.id === 2;
  const matchTime = moment(match.started_at).format('HH:mm');
  const matchDate = moment(match.scheduled_at || match.started_at).format(
    'dddd, MMMM Do'
  );
  const serverName = liveInfo?.serverName || match.server?.name || 'No server set';

  return (
    <section className="flex items-center gap-8 px-8 border-2 border-primary rounded bg-base-100">
      {!isMix && (
        <>
          <div className="mt-3 text-left font-bold text-lg text-accent">{`${match.home_team.name} vs ${match.away_team.name}`}</div>
          <div className="divider divider-vertical m-0" />
        </>
      )}
      <div className="stat">
        <div className="stat-title">{match.config.name}</div>
        <div className="stat-value capitalize">{matchTime}</div>
        <div className="stat-desc">{matchDate}</div>
      </div>
      <div className="stat">
        <div className="stat-title">{serverName}</div>
        <div className="stat-value capitalize">{liveState}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Rounds played</div>
        <div className="stat-value">{match.rounds.length}</div>
      </div>
    </section>
  );
}
