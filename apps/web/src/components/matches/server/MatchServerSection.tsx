import { MatchesJoined } from '@bf2-matchmaking/types';
import ServerActions from '@/components/matches/server/ServerActions';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import NoServer from '@/components/matches/server/NoServer';
import ServerInfo from '@/components/matches/server/ServerInfo';
import Link from 'next/link';
import SelectServerForm from '@/components/matches/SelectServerForm';

interface Props {
  match: MatchesJoined;
}

export default async function MatchServerSection({ match }: Props) {
  const { data: matchServer } = await supabase(cookies).getMatchServers(match.id);
  const server = matchServer?.servers.at(0);

  return (
    <section className="section max-w-md text-left h-fit">
      {!server && <NoServer match={match} matchServer={matchServer} />}
      {server && (
        <>
          <ServerInfo match={match} server={server} />
          <ServerActions match={match} server={server} />
          <div className="divider" />
        </>
      )}
      <SelectServerForm match={match} defaultAddress={server?.ip} />
      <Link className="btn btn-secondary" href={`/matches/${match.id}/server`}>
        Manage match servers
      </Link>
    </section>
  );
}
