import { LiveServer } from '@bf2-matchmaking/types';
import Link from 'next/link';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { api, verify } from '@bf2-matchmaking/utils';
import { Suspense } from 'react';
import CreateServerSection from '@/components/servers/CreateServerSection';
import { CheckCircleIcon } from '@heroicons/react/16/solid';

export default async function Page() {
  const servers = await api.live().getServers().then(verify);

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
            {servers.map((server) => (
              <tr key={server.address} className="hover">
                <td className="truncate">{server.info?.serverName || server.address}</td>
                <td>{server.address}</td>
                <td>{server.port}</td>
                <td className="truncate">{`${server.city}, ${server.country}`}</td>
                <td>
                  {server.noVehicles ? <CheckCircleIcon className="size-5" /> : null}
                </td>
                <td>
                  <ServerStatus server={server} />
                </td>
                <td>{`${server.info?.players.length || 0}/${
                  server.info?.maxPlayers || 0
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
