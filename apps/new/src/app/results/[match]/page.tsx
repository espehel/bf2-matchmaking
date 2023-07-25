import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { verifySingleResult } from '@bf2-matchmaking/supabase';
import RoundsList from '@/components/RoundsList';
import { MatchPlayersRow } from '@bf2-matchmaking/types';

type PlayerTuple = [MatchPlayersRow, string];
interface Props {
  params: { match: string };
}
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
  const teamATickets = match.rounds
    .map((round, i) => (i % 2 === 0 ? round.team1_tickets : round.team2_tickets))
    .reduce((acc, cur) => acc + parseInt(cur), 0);

  const teamBTickets = match.rounds
    .map((round, i) => (i % 2 === 1 ? round.team1_tickets : round.team2_tickets))
    .reduce((acc, cur) => acc + parseInt(cur), 0);

  const winner =
    teamATickets === teamBTickets
      ? 'Draw'
      : teamATickets > teamBTickets
      ? 'Team A wins'
      : 'Team B wins';

  return (
    <main className="main text-center">
      <h1 className="mb-8 text-accent font-bold">{`Match ${match.id} - ${winner}`}</h1>
      <div className="flex w-full justify-around">
        <div>
          <div className="text-xl">Team A - {teamATickets}</div>
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
          <div className="text-xl">Team B - {teamBTickets}</div>
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
      <div className="divider" />
      <RoundsList rounds={match.rounds} />
    </main>
  );
}
