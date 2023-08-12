import { MatchesJoined, MatchPlayersRow } from '@bf2-matchmaking/types';
import MatchActions from '@/components/match/MatchActions';

interface Props {
  match: MatchesJoined;
}
type PlayerTuple = [MatchPlayersRow, string];

export default function MatchSection({ match }: Props) {
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
    <section className="section">
      <h2 className="text-xl">{`${match.config.size / 2}v${match.config.size / 2} - ${
        match.status
      }`}</h2>
      <div className="flex justify-center gap-8">
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
      <MatchActions match={match} />
    </section>
  );
}
