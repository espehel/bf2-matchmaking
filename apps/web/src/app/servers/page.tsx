import { RconBf2Server } from '@bf2-matchmaking/types';
import Link from 'next/link';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ServerCreateForm from '@/components/ServerCreateForm';
import { api, verify } from '@bf2-matchmaking/utils';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

export default async function Page() {
  const servers = await api.rcon().getServers().then(verify);

  const { data: player } = await supabase(cookies).getSessionPlayer();

  return (
    <main className="main">
      <table className="table mt-2 bg-base-100 shadow-xl">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Port</th>
            <th>Location</th>
            <th>Status</th>
            <th>Players</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {servers.map((server) => (
            <tr key={server.ip} className="hover">
              <td className="truncate">{server.info?.serverName || server.name}</td>
              <td>{server.ip}</td>
              <td>{server.port}</td>
              <td className="truncate">{`${server.city}, ${server.country}`}</td>
              <td>
                <ServerStatus server={server} />
              </td>
              <td>{`${server.info?.players.length || 0}/${
                server.info?.maxPlayers || 0
              }`}</td>
              <td>
                <Link className="link link-secondary" href={`/servers/${server.ip}`}>
                  <DocumentMagnifyingGlassIcon className="h-6" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {player && (
        <section className="bg-base-100 border-primary border-2 rounded p-4 mt-6">
          <h2 className="text-xl">Add server</h2>
          <ServerCreateForm />
        </section>
      )}
    </main>
  );
}

function ServerStatus({ server }: { server: RconBf2Server }) {
  if (server.match) {
    return (
      <Link className="link" href={`/matches/${server.match.id}`}>
        {server.match.id}
      </Link>
    );
  } else if (server.info) {
    return 'Idle';
  } else {
    return 'Offline';
  }
}
