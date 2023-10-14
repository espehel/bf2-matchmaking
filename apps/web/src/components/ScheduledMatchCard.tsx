'use client';
import { MatchesJoined } from '@bf2-matchmaking/types';
import moment from 'moment';
import Image from 'next/image';
import { supabaseImageLoader } from '@/lib/supabase/supabase-client';

interface Props {
  match: MatchesJoined;
}

export default function ScheduledMatchCard({ match }: Props) {
  const scheduledAt = moment(match.scheduled_at).format('HH:mm');

  return (
    <section className="flex items-center gap-8 px-8 border-2 border-primary rounded bg-base-100">
      {scheduledAt && (
        <div className="stat w-fit">
          <div className="stat-title">{match.config.name}</div>
          <div className="tooltip" data-tip={moment(match.scheduled_at).toISOString()}>
            <div className="stat-value">{scheduledAt}</div>
          </div>
        </div>
      )}
      <div className="stat w-fit text-left">
        <h2 className="stat-title">{match.server?.name ?? 'No server set'}</h2>
        <div className="stat-value">{`${match.home_team.name} vs ${match.away_team.name}`}</div>
      </div>
      <div className="flex mr-4 ml-auto">
        {match.maps.map((map) => (
          <div key={map.id} className="relative -mr-16 w-44 h-28 overflow-hidden">
            <Image
              className="mask mask-parallelogram object-cover"
              loader={supabaseImageLoader}
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
