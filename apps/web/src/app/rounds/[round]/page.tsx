import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { isTruthy, LiveInfo } from '@bf2-matchmaking/types';
import { verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { formatSecToMin, parseJSON } from '@bf2-matchmaking/utils';
import Link from 'next/link';
import RoundTable from '@/components/RoundTable';
import PlayersRegisterSection from '@/components/PlayersRegisterSection';
import { updatePlayer } from '@/app/rounds/[round]/actions';

interface Props {
  params: Promise<{ round: string }>;
  searchParams: Promise<{ tab?: string }>;
}
export default async function RoundPage(props: Props) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const cookieStore = await cookies();
  const round = await supabase(cookieStore)
    .getRound(parseInt(params.round))
    .then(verifySingleResult);

  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();
  const isPlayerAdmin = Boolean(adminRoles?.player_admin);
  const isRegisterTab = searchParams.tab === 'register' && isPlayerAdmin;

  const info = parseJSON<LiveInfo>(round.info);

  const registeredPlayers = await supabase(cookieStore)
    .getPlayersByKeyhashList(info.players.map(({ keyhash }) => keyhash).filter(isTruthy))
    .then(verifyResult);
  const matchPlayers = round.match
    ? (await supabase(cookieStore).getPlayersByMatchId(round.match)).data?.players || []
    : [];

  const roundTime =
    parseInt(info.roundTime) < parseInt(info.timeLimit)
      ? formatSecToMin(info.roundTime)
      : formatSecToMin(info.timeLimit);

  async function registerPlayer(playerId: string, keyhash: string) {
    'use server';
    return updatePlayer(round.id, playerId, { keyhash });
  }

  return (
    <main className="main">
      <h1 className="text-center mb-10">
        <span>{info.team1_Name}</span>
        <span className="bg-primary text-primary-content text-5xl font-bold p-2 mx-4 rounded">
          {`${info.team1_tickets} - ${info.team2_tickets}`}
        </span>
        <span>{info.team2_Name}</span>
      </h1>
      <section className="section mb-6">
        <h2>Info:</h2>
        <div className="flex flex-wrap gap-4">
          <p>{`Map: ${round.map.name}`}</p>
          <p>{`Round time: ${roundTime}`}</p>
          <p>{`Connected players: ${info.connectedPlayers}`}</p>
          {round.server && (
            <Link
              className="link"
              href={`/servers/${round.server.ip}`}
            >{`Server: ${round.server.name}`}</Link>
          )}
          {round.match && (
            <Link
              className="link"
              href={`/results/${round.match}`}
            >{`Match: ${round.match}`}</Link>
          )}
        </div>
      </section>
      <div className="tabs tabs-lifted mb-4">
        <Link
          href={`/rounds/${round.id}?tab=scores`}
          className={'tab tab-lg tab-bordered'.concat(
            !isRegisterTab ? ' tab-active' : ''
          )}
        >
          Scores
        </Link>
        {isPlayerAdmin && (
          <Link
            href={`/rounds/${round.id}?tab=register`}
            className={'tab tab-lg tab-bordered'.concat(
              isRegisterTab ? ' tab-active' : ''
            )}
          >
            Register
          </Link>
        )}
      </div>
      {!isRegisterTab && (
        <section>
          <RoundTable liveInfo={info} />
        </section>
      )}
      {isRegisterTab && (
        <PlayersRegisterSection
          playerList={info.players}
          registeredPlayers={registeredPlayers}
          registerPlayerAction={registerPlayer}
          matchPlayers={matchPlayers}
        />
      )}
    </main>
  );
}
