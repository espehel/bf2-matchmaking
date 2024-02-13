import { LiveServer } from '@bf2-matchmaking/types';
import { MapPinIcon, ServerStackIcon } from '@heroicons/react/24/solid';

interface Props {
  server: LiveServer;
}

export default function ServerHeader({ server }: Props) {
  return (
    <div>
      <h1>{server.info.serverName}</h1>
      <div className="flex gap-4 font-bold mt-2">
        <p className="flex items-center gap-1">
          <ServerStackIcon className="size-4" />
          <span>{server.address}</span>
        </p>
        <p className="flex items-center gap-1">
          <MapPinIcon className="size-4" />
          <span>{`${server.city}, ${server.country}`}</span>
        </p>
      </div>
    </div>
  );
}
