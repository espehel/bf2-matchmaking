import { MatchConfigsRow } from '@bf2-matchmaking/types';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  config: MatchConfigsRow;
}

export default async function ConfigCard({ config }: Props) {
  const { data: owner } = await supabase(cookies).getPlayer(config.owner);
  return (
    <div className="card w-96 bg-primary text-primary-content">
      <div className="card-body">
        <div className="collapse collapse-plus">
          <input type="checkbox" />
          <div className="collapse-title">
            <h2 className="card-title">{config.name}</h2>
            <p>{`Type: ${config.type}`}</p>
            <p>{`Owner: ${owner?.nick || config.owner}`}</p>
          </div>
          <div className="collapse-content">
            <p>{`Draft: ${config.draft}`}</p>
            <p>{`Map draft: ${config.map_draft}`}</p>
            <p>{`Size: ${config.size}`}</p>
            <p>{`Channel: ${config.channel}`}</p>
            <p>{`Guild: ${config.guild}`}</p>
            <p>{`Maps: ${config.maps}`}</p>
            <p>{`Vehicles: ${config.vehicles}`}</p>
            <p>{`Visible: ${config.visible}`}</p>
          </div>
        </div>
        <div className="card-actions justify-end">
          <Link
            href={`/admin/configs/${config.id}/ratings`}
            className="btn btn-secondary"
          >
            Go to Ratings
          </Link>
        </div>
      </div>
    </div>
  );
}
