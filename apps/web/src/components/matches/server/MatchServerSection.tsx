import { MatchesJoined } from '@bf2-matchmaking/types';
import ServerActions from '@/components/matches/server/ServerActions';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import NoServer from '@/components/matches/server/NoServer';
import ServerInfo from '@/components/matches/server/ServerInfo';
import Link from 'next/link';

interface Props {
  match: MatchesJoined;
}

export default async function MatchServerSection({ match }: Props) {
  const { data: matchServer } = await supabase(cookies).getMatchServer(match.id);
  const server = matchServer?.server;

  return (
    <section className="section max-w-md text-left">
      {!server && <NoServer match={match} matchServer={matchServer} />}
      {server && (
        <>
          <ServerInfo match={match} server={server} />
          <ServerActions match={match} server={server} />
        </>
      )}
      <Link className="btn btn-secondary mt-auto" href={`/matches/${match.id}/server`}>
        Manage match server
      </Link>
    </section>
  );
}
