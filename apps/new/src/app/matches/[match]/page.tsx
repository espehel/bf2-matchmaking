import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import { MatchPlayersRow } from '@bf2-matchmaking/types';

interface Props {
  params: { match: string };
}
type PlayerTuple = [MatchPlayersRow, string];
export default async function ResultsMatch({ params }: Props) {
  const match = await supabase(cookies)
    .getMatch(parseInt(params.match))
    .then(verifySingleResult);

  const isTeam =
    (team: string) =>
    ([mp]: PlayerTuple) =>
      mp.team === team;

  const toPlayerTuple = (mp: MatchPlayersRow, i: number): PlayerTuple => [
    mp,
    match.players.find((player) => player.id === mp.player_id)?.full_name ||
      `Player ${i}`,
  ];

  return (
    <main className="main flex flex-col items-center text-center">
      <h1 className="mb-8 text-accent font-bold">{`Match ${match.id}`}</h1>
      <div className="flex justify-center gap-8 border-2 border-primary rounded p-6 bg-base-100">
        <div>
          <div className="text-xl font-bold mb-2">Team A</div>
          <ul>
            {match.teams
              .map(toPlayerTuple)
              .filter(isTeam('a'))
              .map(([mp, username]) => (
                <li key={mp.player_id}>{username}</li>
              ))}
          </ul>
        </div>
        <div className="divider divider-horizontal">vs</div>
        <div>
          <div className="text-xl font-bold mb-2">Team B</div>
          <ul>
            {match.teams
              .map(toPlayerTuple)
              .filter(isTeam('b'))
              .map(([mp, username]) => (
                <li key={mp.player_id}>{username}</li>
              ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
