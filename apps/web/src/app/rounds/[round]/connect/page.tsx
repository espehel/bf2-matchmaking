import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import PlayerConnectSection from '@/components/PlayerConnectSection';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';
import { parseJSON } from '@bf2-matchmaking/utils/src/json-utils';
import { LiveInfo } from '@bf2-matchmaking/types';

interface Props {
  params: { round: string };
}
export default async function RoundClaimPage({ params }: Props) {
  const round = await supabase(cookies)
    .getRound(parseInt(params.round))
    .then(verifySingleResult);
  const { data: session } = await supabase(cookies).auth.getSession();

  const info = parseJSON<LiveInfo>(round.info);

  //TODO: use session to fetch player and give option to delete keyhash
  return (
    <main className="text-center">
      <h1>Connect player to discord user</h1>
      <div className="w-3/4 m-auto">
        <p>
          Your current public ip address will be used to match a player from the chosen
          round.
        </p>
        <PlayerConnectSection playerList={info.players} session={session.session} />
        {round.match && (
          <Link className="link float-left" href={`/results/${round.match}`}>
            Back to match result
          </Link>
        )}
      </div>
    </main>
  );
}
