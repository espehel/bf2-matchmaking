import { Challenge } from '@bf2-matchmaking/types';
import Time from '@/components/commons/Time';
import AcceptOpenChallengeModal from '@/components/challenges/AcceptOpenChallengeModal';
import { SupabaseImage } from '@/components/commons/SupabaseImage';

interface Props {
  challenge: Challenge;
  readOnly?: boolean;
}

export default function OpenChallengeCard({ challenge, readOnly = false }: Props) {
  return (
    <div className="card card-sm w-96 bg-base-100 shadow-md border border-primary shadow-primary image-full">
      <figure>
        <SupabaseImage
          className="rounded-box"
          fill={true}
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
