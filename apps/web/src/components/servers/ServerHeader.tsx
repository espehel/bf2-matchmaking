import { MapPinIcon, ServerStackIcon } from '@heroicons/react/24/solid';
import { LiveServer } from '@bf2-matchmaking/types/server';

interface Props {
  server: LiveServer;
  isConnected: boolean;
  hasAdmin: boolean;
}

export default async function ServerHeader({ server, isConnected, hasAdmin }: Props) {
  return (
    <div>
      <h1>{server.live?.serverName || server.address}</h1>
      <div className="flex gap-4 items-center font-bold">
        <p className="flex items-center gap-1">
          <ServerStackIcon className="size-4" />
          <span>{server.address}</span>
        </p>
        {server.data && (
          <p className="flex items-center gap-1">
            <MapPinIcon className="size-4" />
            <span>{`${server.data.city}, ${server.data.country}`}</span>
          </p>
        )}
        <div className="flex gap-1">
          {isConnected && <div className="badge badge-success">Connected</div>}
          {hasAdmin && <div className="badge badge-info">Admin</div>}
        </div>
      </div>
    </div>
  );
}
