import { MatchesJoined } from '@bf2-matchmaking/types';
import { getTeamRounds, getTeamTickets } from '@bf2-matchmaking/utils/src/results-utils';
import { isUniqueObject } from '@bf2-matchmaking/utils';
import { supabaseImageLoader } from '@/lib/supabase-client';
import Image from 'next/image';

interface Props {
  match: MatchesJoined;
}

export default function MatchResultCard({ match }: Props) {
  const maps = match.rounds.map((r) => r.map).filter(isUniqueObject);

  return (
    <section className="flex items-center gap-8 px-8 border-2 border-primary rounded bg-base-100">
      <h2 className="text-xl">{`Match ${match.id}`}</h2>
      <div className="flex">
        <div className="stat">
          <div className="stat-title">Team A</div>
          <div className="stat-value">{getTeamRounds(match.rounds, 'a')}</div>
          <div className="stat-desc">{`Tickets: ${getTeamTickets(
            match.rounds,
            'a'
          )}`}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Team B</div>
          <div className="stat-value">{getTeamRounds(match.rounds, 'b')}</div>
          <div className="stat-desc">{`Tickets: ${getTeamTickets(
            match.rounds,
            'b'
          )}`}</div>
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
