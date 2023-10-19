import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { isTruthy, PlayerListItem, ServerInfo } from '@bf2-matchmaking/types';
import { verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { formatSecToMin } from '@bf2-matchmaking/utils';
import Link from 'next/link';
import RoundTable from '@/components/RoundTable';
import PlayersRegisterSection from '@/components/PlayersRegisterSection';
import { updatePlayer } from '@/app/rounds/[round]/actions';
import { parseJSON } from '@bf2-matchmaking/utils/src/json-utils';

interface Props {
  params: { round: string };
  searchParams: { tab?: string };
}
export default async function RoundPage({ params, searchParams }: Props) {
  const round = await supabase(cookies)
    .getRound(parseInt(params.round))
    .then(verifySingleResult);

  const { data: adminRoles } = await supabase(cookies).getAdminRoles();

  const isPlayerAdmin = Boolean(adminRoles?.player_admin);
  const isRegisterTab = searchParams.tab === 'register' && isPlayerAdmin;

  const serverInfo = parseJSON<ServerInfo>(round.si);
  const playerList = parseJSON<Array<PlayerListItem>>(round.pl);

  const registeredPlayers = playerList
    ? await supabase(cookies)
        .getPlayersByKeyhashList(
          playerList.map(({ keyhash }) => keyhash).filter(isTruthy)
        )
        .then(verifyResult)
    : [];

  const roundTime =
    parseInt(serverInfo.roundTime) < parseInt(serverInfo.timeLimit)
      ? formatSecToMin(serverInfo.roundTime)
      : formatSecToMin(serverInfo.timeLimit);

  async function registerPlayer(playerId: string, keyhash: string) {
    'use server';
    return updatePlayer(round.id, playerId, { keyhash });
  }

  return (
    <main className="main">
      <h1 className="text-center mb-10">
        <span>{serverInfo.team1_Name}</span>
        <span className="bg-primary text-primary-content text-5xl font-bold p-2 mx-4 rounded">
          {`${serverInfo.team1_tickets} - ${serverInfo.team2_tickets}`}
        </span>
        <span>{serverInfo.team2_Name}</span>
      </h1>
      <section className="section mb-6">
        <h2>Info:</h2>
        <div className="flex flex-wrap gap-4">
          <p>{`Map: ${round.map.name}`}</p>
          <p>{`Round time: ${roundTime}`}</p>
          <p>{`Connected players: ${serverInfo.connectedPlayers}`}</p>
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
      <div className="tabs mb-4">
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
          <RoundTable serverInfo={serverInfo} playerList={playerList} />
        </section>
      )}
      {isRegisterTab && (
        <PlayersRegisterSection
          playerList={playerList}
          registeredPlayers={registeredPlayers}
          registerPlayer={registerPlayer}
        />
      )}
    </main>
  );
}