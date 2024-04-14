import { Challenge } from '@bf2-matchmaking/types';
import Time from '@/components/commons/Time';
import { supabaseImageLoader } from '@/lib/supabase/supabase-client';
import Image from 'next/image';
import AcceptChallengeModal from '@/components/challenges/AcceptChallengeModal';

interface Props {
  challenge: Challenge;
}

export default function OpenChallengeCard({ challenge }: Props) {
  return (
    <div className="card card-compact w-96 bg-base-100 shadow-xl image-full">
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
        <div className="card-actions justify-end">
          <AcceptChallengeModal challenge={challenge} />
        </div>
      </div>
    </div>
  );
}
