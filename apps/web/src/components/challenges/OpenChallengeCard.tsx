import { Challenge } from '@bf2-matchmaking/types';
import Time from '@/components/commons/Time';
import { supabaseImageLoader } from '@/lib/supabase/supabase-client';
import Image from 'next/image';
import AcceptOpenChallengeModal from '@/components/challenges/AcceptOpenChallengeModal';

interface Props {
  challenge: Challenge;
  readOnly?: boolean;
}

export default function OpenChallengeCard({ challenge, readOnly = false }: Props) {
  return (
    <div className="card card-compact w-96 bg-base-100 shadow-md border border-primary shadow-primary image-full">
      <figure>
        <Image
          className="rounded-box"
          fill={true}
          loader={supabaseImageLoader}
          src={`map_images/${challenge.home_map.id}.webp`}
          alt={challenge.home_map.name}
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{challenge.home_team.name}</h2>
        <Time date={challenge.scheduled_at} format="EEEE HH:mm, DD" />
        {!readOnly && (
          <div className="card-actions justify-end">
            <AcceptOpenChallengeModal challenge={challenge} />
          </div>
        )}
      </div>
    </div>
  );
}
