import { MatchesJoined } from '@bf2-matchmaking/types';
import ServerActions from '@/components/matches/server/ServerActions';
import { supabase } from '@/lib/supabase/supabase-server';
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
  const { data: activeServer } = await api.v2.getMatchServer(match.id);

  return (
    <section className="section max-w-md text-left h-fit">
      {!activeServer && <NoServer match={match} />}
      {activeServer && (
        <>
          <ServerInfo match={match} server={activeServer} />
          <ServerActions match={match} server={activeServer} />
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
