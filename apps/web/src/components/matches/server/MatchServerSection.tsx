import { MatchesJoined } from '@bf2-matchmaking/types';
import ServerActions from '@/components/matches/server/ServerActions';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import NoServer from '@/components/matches/server/NoServer';
import ServerInfo from '@/components/matches/server/ServerInfo';
import Link from 'next/link';
import AddServerForm from '@/components/matches/AddServerForm';
import { api } from '@bf2-matchmaking/utils';

interface Props {
  match: MatchesJoined;
}

export default async function MatchServerSection({ match }: Props) {
  const { data: matchServers } = await supabase(cookies).getMatchServers(match.id);
  const { data: server } = await api.live().getMatchServer(match.id);

  return (
    <section className="section max-w-md text-left h-fit">
      {!server && <NoServer match={match} matchServers={matchServers} />}
      {server && (
        <>
          <ServerInfo match={match} server={server} />
          <ServerActions match={match} server={server} />
          <div className="divider" />
        </>
      )}
      <AddServerForm match={match} />
      <Link className="btn btn-secondary" href={`/matches/${match.id}/server`}>
        Manage match servers
      </Link>
    </section>
  );
}
