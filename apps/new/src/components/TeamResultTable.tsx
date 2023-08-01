import { MatchResult, PlayersRow } from '@bf2-matchmaking/types';

interface Props {
  playerResults: Array<[PlayersRow, MatchResult | null]>;
}

export default function TeamResultTable({ playerResults }: Props) {
  return (
    <table className="table mt-2 bg-base-100 shadow-xl">
      <thead>
        <tr>
          <th />
          <th>Name</th>
          <th>Score</th>
          <th>Kills</th>
          <th>Deaths</th>
        </tr>
      </thead>
      <tbody>
        {playerResults.map(([player, result], i) => (
          <tr key={player.id} className="hover">
            <th>{i + 1}</th>
            <td className="truncate">{player.full_name}</td>
            {result ? (
              <>
                <td>{result.score}</td>
                <td>{result.kills}</td>
                <td>{result.deaths}</td>
              </>
            ) : (
              <td colSpan={3}>Unregistered player</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
