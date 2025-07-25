import { AcceptedChallenge } from '@bf2-matchmaking/types';
import Time from '@/components/commons/Time';
import Link from 'next/link';
import { SupabaseImage } from '@/components/commons/SupabaseImage';

interface Props {
  challenge: AcceptedChallenge;
}

export default function AcceptedChallengeCard({ challenge }: Props) {
  return (
    <div className="card card-sm w-96 bg-base-100 shadow-md border border-primary shadow-primary image-full">
      <figure className="flex">
        <SupabaseImage
          className="rounded-box"
          fill={true}
          src={`map_images/${challenge.away_map.id}.webp`}
          alt={challenge.away_map.name}
        />
        <SupabaseImage
          className="mask mask-parallelogram mask-half-card rounded-box"
          fill={true}
          src={`map_images/${challenge.home_map.id}.webp`}
          alt={challenge.home_map.name}
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{`${challenge.home_team.name} vs ${challenge.away_team.name}`}</h2>
        <Time date={challenge.scheduled_at} format="EEEE HH:mm, DD" />
        <div className="card-actions justify-end">
          <Link className="btn btn-secondary btn-sm" href={`/matches/${challenge.match}`}>
            Go to match
          </Link>
        </div>
      </div>
    </div>
  );
}
