import { PendingChallenge } from '@bf2-matchmaking/types';
import Time from '@/components/commons/Time';
import AcceptPendingChallengeModal from '@/components/challenges/AcceptPendingChallengeModal';
import { SupabaseImage } from '@/components/commons/SupabaseImage';

interface Props {
  challenge: PendingChallenge;
}

export default function PendingChallengeCard({ challenge }: Props) {
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
        <h2 className="card-title">{`${challenge.home_team.name} vs ${challenge.away_team.name}`}</h2>
        <Time date={challenge.scheduled_at} format="EEEE HH:mm, DD" />
        <div className="card-actions justify-end">
          <AcceptPendingChallengeModal challenge={challenge} />
        </div>
      </div>
    </div>
  );
}
