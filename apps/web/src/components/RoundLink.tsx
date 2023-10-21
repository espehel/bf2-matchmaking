import { LiveInfo, RoundsJoined } from '@bf2-matchmaking/types';
import Link from 'next/link';
import Image from 'next/image';
import { supabaseImageLoader } from '@/lib/supabase/supabase-client';
import moment from 'moment';
import { parseJSON } from '@bf2-matchmaking/utils/src/json-utils';

interface Props {
  round: RoundsJoined;
}

export default function RoundLink({ round }: Props) {
  const info = parseJSON<LiveInfo>(round.info);
  return (
    <Link href={`/rounds/${round.id}`}>
      <div className="card card-side w-full bg-base-100 shadow-xl">
        <figure className="relative w-1/4 overflow-hidden">
          <Image
            className="object-cover"
            loader={supabaseImageLoader}
            src={`map_images/${round.map.id}.webp`}
            fill={true}
            sizes="25%"
            alt={round.map.name}
          />
        </figure>
        <div className="card-body flex-row">
          <div className="mr-auto text-left">
            <p className="text-xl">{round.map.name}</p>
            <p className="text-sm">
              {moment(round.created_at).format('ddd MMM Do, HH:mm')}
            </p>
          </div>
          <div>
            <p className="text-md font-bold">{info.team1_Name}</p>
            <p className="text-md">{info.team1_tickets}</p>
          </div>
          <div>
            <p className="text-md font-bold">{info.team2_Name}</p>
            <p className="text-md">{info.team2_tickets}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
