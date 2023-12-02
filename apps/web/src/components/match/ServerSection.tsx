import {
  GameStatus,
  MatchesJoined,
  MatchServer,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { api, formatSecToMin } from '@bf2-matchmaking/utils';
import ServerActions from '@/components/match/ServerActions';
import RevalidateForm from '@/components/RevalidateForm';
import { getKey } from '@bf2-matchmaking/utils/src/object-utils';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  matchServer: MatchServer;
  match: MatchesJoined;
}

export default async function ServerSection({ matchServer, match }: Props) {
  const { data: regions } = await api.platform().getLocations();
  const city = regions?.find((r) => r.id === matchServer.region)?.city;

  if (!matchServer.server && matchServer.instance && city) {
    return (
      <section className="section max-w-md text-left">
        <div className="flex justify-between items-center gap-2">
          <h2 className="text-xl">{`Generating server in ${city}...`}</h2>
          <RevalidateForm path={`/matches/${matchServer.id}`} />
        </div>
      </section>
    );
  }

  if (!matchServer.server) {
    return (
      <section className="section max-w-md text-left">
        <div className="flex justify-between items-center gap-2">
          <h2 className="text-xl">{`Server will be created${
            ` in ${city}` || ''
          } 15 min before match start.`}</h2>
          <RevalidateForm path={`/matches/${matchServer.id}`} />
        </div>
      </section>
    );
  }

  const isMatchOfficer = await supabase(cookies).isMatchOfficer(match);
  const isMatchPlayer = await supabase(cookies).isMatchPlayer(match);
  const { data: server } = await api.rcon().getServer(matchServer.server.ip);
  const { data: maps } = await supabase(cookies).getMaps();

  return (
    <section className="section max-w-md text-left">
      <div>
        <div className="flex justify-between items-center gap-2">
          <h2 className="text-xl">{`Server: ${matchServer.server.name}`}</h2>
          <RevalidateForm path={`/matches/${matchServer.id}`} />
        </div>
        <p className="font-bold">{`${matchServer.server.ip}:${matchServer.server.port}`}</p>
        {server?.info && (
          <div className="grid grid-cols-2 gap-x-2">
            <div>{`Game status: ${getKey(
              GameStatus,
              server.info.currentGameStatus
            )}`}</div>
            <div>{`Players: ${server.info.connectedPlayers}`}</div>
            <div>{`Map: ${server.info.currentMapName}`}</div>
            <div>{`Round time: ${formatSecToMin(server.info.roundTime)}`}</div>
          </div>
        )}
      </div>
      {server && isMatchPlayer && (
        <Link
          className="btn btn-primary btn-lg btn-wide m-auto"
          href={server.joinmeHref}
          target="_blank"
        >
          Join match
        </Link>
      )}
      {isMatchOfficer && MatchStatus.Ongoing && (
        <div>
          <div className="divider mt-0" />
          <ServerActions matchServer={matchServer} server={server} maps={maps} />
        </div>
      )}
    </section>
  );
}
