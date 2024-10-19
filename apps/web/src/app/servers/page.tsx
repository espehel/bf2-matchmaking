import { isConnectedLiveServer, isOfflineLiveServer } from '@bf2-matchmaking/types';
import Link from 'next/link';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { api, sortLiveServerByName, verify } from '@bf2-matchmaking/utils';
import { Suspense } from 'react';
import CreateServerSection from '@/components/servers/CreateServerSection';
import { CheckCircleIcon } from '@heroicons/react/16/solid';
import { LiveServer } from '@bf2-matchmaking/types/server';

export default async function Page() {
  const servers = await api.v2.getServers().then(verify).then(sortLiveServerByName);

  return (
    <main className="main">
      <div className="mt-2 border border-primary rounded p-4 bg-base-100">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Port</th>
              <th>Server location</th>
              <th>Inf</th>
              <th>Status</th>
              <th>Players</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {servers.filter(isConnectedLiveServer).map((server) => (
              <tr key={server.address} className="hover">
                <td className="truncate">{server.data.name}</td>
                <td>{server.address}</td>
                <td>{server.data.port}</td>
                <td className="truncate">{`${server.data.city}, ${server.data.country}`}</td>
                <td>
                  {server.data.noVehicles ? <CheckCircleIcon className="size-5" /> : null}
                </td>
                <td>
                  <ServerStatus server={server} />
                </td>
                <td>{`${server.live?.players.length || 0}/${
                  server.live?.maxPlayers || 0
                }`}</td>
                <td>
                  <Link
                    className="link link-secondary"
                    href={`/servers/${server.address}`}
                  >
                    <DocumentMagnifyingGlassIcon className="h-6" />
                  </Link>
                </td>
              </tr>
            ))}
            {servers.filter(isOfflineLiveServer).map((server) => (
              <tr key={server.address} className="hover">
                <td className="truncate">-</td>
                <td>{server.address}</td>
                <td>-</td>
                <td className="truncate">-</td>
                <td>-</td>
                <td>
                  <ServerStatus server={server} />
                </td>
                <td>-</td>
                <td>
                  <Link
                    className="link link-secondary"
                    href={`/servers/${server.address}`}
                  >
                    <DocumentMagnifyingGlassIcon className="h-6" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Suspense fallback={null}>
        <CreateServerSection />
      </Suspense>
    </main>
  );
}

function ServerStatus({ server }: { server: LiveServer }) {
  if (server.matchId) {
    return (
      <Link className="link" href={`/matches/${server.matchId}`}>
        {server.matchId}
      </Link>
    );
  } else if (server.live) {
    return 'Idle';
  } else {
    return 'Offline';
  }
}
