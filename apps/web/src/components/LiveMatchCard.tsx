import { LiveInfo, LiveServerState, MatchesJoined } from '@bf2-matchmaking/types';
import moment from 'moment';
import Time from '@/components/commons/Time';

interface Props {
  match: MatchesJoined;
  liveInfo: LiveInfo | null;
  liveState: LiveServerState;
}

export default function LiveMatchCard({ match, liveInfo, liveState }: Props) {
  const date = match.scheduled_at || match.started_at || match.created_at;
  const serverName = liveInfo?.serverName || match.server?.name || 'No server set';
  const teamText =
    match.config.type === 'Mix'
      ? ''
      : `: ${match.home_team.name} vs. ${match.away_team.name}`;
  return (
    <section className="px-8 border-2 border-primary rounded bg-base-100">
      <h3 className="mt-3 text-left font-bold text-lg text-accent">{`${match.config.type}${teamText}`}</h3>
      <div className="divider divider-vertical m-0" />
      <div className="flex items-center gap-8">
        <div className="stat">
          <div className="stat-title">{match.config.name}</div>
          <div className="stat-value capitalize">
            <Time date={date} format="HH:mm" />
          </div>
          <div className="stat-desc">
            <Time date={date} format="EEEE, MMMM d" />
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">{serverName}</div>
          <div className="stat-value capitalize">{liveState}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Rounds played</div>
          <div className="stat-value">{match.rounds.length}</div>
        </div>
      </div>
    </section>
  );
}
