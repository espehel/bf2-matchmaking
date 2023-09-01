import { MatchResultsRow, RoundsJoined } from '@bf2-matchmaking/types';
import { isUniqueObject } from '@bf2-matchmaking/utils';
import { supabaseImageLoader } from '@/lib/supabase-client';
import Image from 'next/image';

interface Props {
  matchResult: [MatchResultsRow, MatchResultsRow] | null;
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
    <section className="flex items-center gap-8 px-8 border-2 border-primary rounded bg-base-100">
      <h2 className="text-xl">{`Match ${matchId}`}</h2>
      <div className="flex">
        <div className="stat">
          <div className="stat-title">{`Team ${team1.team}`}</div>
          <div className="stat-value">{team1.rounds}</div>
          <div className="stat-desc">{`Tickets: ${team1.tickets}`}</div>
        </div>
        <div className="stat">
          <div className="stat-title">{`Team ${team2.team}`}</div>
          <div className="stat-value">{team2.rounds}</div>
          <div className="stat-desc">{`Tickets: ${team2.tickets}`}</div>
        </div>
      </div>
      <div className="flex mr-4 ml-auto">
        {maps.map((map) => (
          <div key={map.id} className="relative -mr-16 w-44 h-28 overflow-hidden">
            <Image
              className="mask mask-parallelogram object-cover"
              loader={supabaseImageLoader}
              src={`map_images/${map.id}.webp`}
              fill={true}
              alt={map.name}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
