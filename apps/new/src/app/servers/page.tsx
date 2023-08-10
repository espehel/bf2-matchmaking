import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifyResult } from '@bf2-matchmaking/supabase';
import { ServersJoined } from '@bf2-matchmaking/types';
import Link from 'next/link';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import ServerCreateForm from '@/components/ServerCreateForm';

export default async function Page() {
  const servers = await supabase(cookies).getServers().then(verifyResult);
  return (
    <main className="main">
      <table className="table mt-2 bg-base-100 shadow-xl">
        <thead>
          <tr>
            <th>Name</th>
            <th>Port</th>
            <th>Address</th>
            <th>In use</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {servers.map((server) => (
            <tr key={server.ip} className="hover">
              <td className="truncate">{server.name}</td>
              <td>{server.port}</td>
              <td>{server.ip}</td>
              <td>
                <MatchServer server={server} />
              </td>
              <td>
                <Link className="link link-secondary" href={`/servers/${server.ip}`}>
                  <DocumentMagnifyingGlassIcon className="h-6" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <section className="bg-base-100 border-primary border-2 rounded p-4 mt-6">
        <h2 className="text-xl">Add server</h2>
        <ServerCreateForm />
      </section>
    </main>
  );
}

function MatchServer({ server }: { server: ServersJoined }) {
  const match = server.matches.at(0);
  if (match) {
    return (
      <Link className="link" href={`/matches/${match.id}`}>
        {match.id}
      </Link>
    );
  } else {
    return 'No';
  }
}
