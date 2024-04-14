import { AcceptedChallenge } from '@bf2-matchmaking/types';
import Time from '@/components/commons/Time';
import { supabaseImageLoader } from '@/lib/supabase/supabase-client';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  challenge: AcceptedChallenge;
}

export default function AcceptedChallengeCard({ challenge }: Props) {
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
        <Image
          className="rounded-box"
          fill={true}
          loader={supabaseImageLoader}
          src={`map_images/${challenge.away_map.id}.webp`}
          alt={challenge.away_map.name}
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{`${challenge.home_team.name} vs ${challenge.away_team.name}`}</h2>
        <Time date={challenge.scheduled_at} format="EEEE HH:mm, DD" />
        <div className="card-actions justify-end">
          <Link href={`/matches/${challenge.match}`}>Go to match</Link>
        </div>
      </div>
    </div>
  );
}
