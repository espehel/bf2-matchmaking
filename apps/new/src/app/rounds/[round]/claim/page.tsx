import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import PlayerClaimSection from '@/components/PlayerClaimSection';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import Link from 'next/link';

interface Props {
  params: { round: string };
}
export default async function RoundClaimPage({ params }: Props) {
  const round = await supabase(cookies)
    .getRound(parseInt(params.round))
    .then(verifySingleResult);
  const { data: session } = await supabase(cookies).auth.getSession();

  const playerList = typeof round.pl === 'string' ? JSON.parse(round.pl) : null;

  if (!playerList) {
    return <main>No playerlist found for the round</main>;
  }
  //TODO: use session to fetch player and give option to delete keyhash
  return (
    <main className="text-center">
      <h1>Connect player to discord user</h1>
      <div className="w-3/4 m-auto">
        <p>
          Your current public ip address will be used to match a player from the chosen
          round.
        </p>
        <PlayerClaimSection playerList={playerList} session={session.session} />
        {round.match && (
          <Link className="link float-left" href={`/results/${round.match}`}>
            Back to match result
          </Link>
        )}
      </div>
    </main>
  );
}
