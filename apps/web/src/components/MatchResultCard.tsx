import { MatchResultsJoined, RoundsJoined } from '@bf2-matchmaking/types';
import { isUniqueObject } from '@bf2-matchmaking/utils';
import Time from '@/components/commons/Time';
import { SupabaseImage } from '@/components/commons/SupabaseImage';

interface Props {
  matchResult: [MatchResultsJoined, MatchResultsJoined] | null;
  rounds: Array<RoundsJoined>;
  matchId: string;
}

export default function MatchResultCard({ matchId, matchResult, rounds }: Props) {
  if (!matchResult) {
    return null;
  }
  const [team1, team2] = matchResult;

  const maps = rounds.map((r) => r.map).filter(isUniqueObject);

  return (
    <section className="flex items-center gap-8 px-8 border border-base-300 rounded-lg bg-base-200 shadow-sm card-interactive group">
      <div className="stat">
        <div className="stat-title">{`Match ${matchId}`}</div>
        <div className="stat-value capitalize">
          <Time date={team1.created_at} format="HH:mm" />
        </div>
        <div className="stat-desc">
          <Time date={team1.created_at} format="EEEE, MMMM d" />
        </div>
      </div>
      <div className="flex">
        <div className="stat">
          <div className="stat-title">{`Team ${team1.team.name}`}</div>
          <div className="stat-value">{team1.rounds}</div>
          <div className="stat-desc">{`Tickets: ${team1.tickets}`}</div>
        </div>
        <div className="stat">
          <div className="stat-title">{`Team ${team2.team.name}`}</div>
          <div className="stat-value">{team2.rounds}</div>
          <div className="stat-desc">{`Tickets: ${team2.tickets}`}</div>
        </div>
      </div>
      <div className="flex mr-4 ml-auto">
        {maps.map((map) => (
          <div key={map.id} className="relative -mr-16 w-44 h-28 overflow-hidden transition-transform duration-300 group-hover:scale-105">
            <SupabaseImage
              className="mask mask-parallelogram object-cover"
              src={`map_images/${map.id}.webp`}
              fill={true}
              sizes="11rem"
              alt={map.name}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
