import Image from 'next/image';
import { PublicMatchRole } from '@bf2-matchmaking/schemas/types';
import { NoSymbolIcon } from '@heroicons/react/24/solid';

interface Props {
  role?: PublicMatchRole | null;
  className?: string;
}

export default function RoleAvatar({ role, className }: Props) {
  return (
    <div className="avatar">
      {role ? (
        <div className="w-6 rounded-full">
          <Image
            src={`/${role}.png`}
            alt={role}
            width={96}
            height={96}
            className={className}
          />
        </div>
      ) : (
        <NoSymbolIcon className="opacity-20" />
      )}
    </div>
  );
}
