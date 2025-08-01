import { MatchesJoined } from '@bf2-matchmaking/types';
import moment from 'moment';
import Time from '@/components/commons/Time';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { api } from '@bf2-matchmaking/utils';
import { SupabaseImage } from '@/components/commons/SupabaseImage';

interface Props {
  match: MatchesJoined;
}

export default async function ScheduledMatchCard({ match }: Props) {
  const cookieStore = await cookies();
  const { data: matchServer } = await supabase(cookieStore).getMatchServers(match.id);
  const { data: regions } = await api.platform().getRegions();
  const { data: generatedServers } = await supabase(
    cookieStore
  ).getGeneratedServersByMatchId(match.id);
  const city = regions?.find((r) => generatedServers?.at(0)?.region === r.id)?.city;
  const serverText =
    matchServer?.servers?.at(0)?.name ?? (city ? `${city} server` : 'No server set');

  return (
    <section className="flex items-center gap-8 px-8 border-2 border-primary rounded bg-base-100">
      {match.scheduled_at && (
        <div className="stat w-fit">
          <div className="stat-title">{match.config.name}</div>
          <div className="tooltip" data-tip={moment(match.scheduled_at).toISOString()}>
            <div className="stat-value">
              <Time date={match.scheduled_at} format="HH:mm" />
            </div>
          </div>
        </div>
      )}
      <div className="stat w-fit text-left">
        <h2 className="stat-title">{serverText}</h2>
        <div className="stat-value">{`${match.home_team.name} vs ${match.away_team.name}`}</div>
      </div>
      <div className="flex mr-4 ml-auto">
        {match.maps.map((map) => (
          <div key={map.id} className="relative -mr-16 w-44 h-28 overflow-hidden">
            <SupabaseImage
              className="mask mask-squircle object-cover"
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
