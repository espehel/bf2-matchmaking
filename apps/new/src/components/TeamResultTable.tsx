import { MatchesJoined, MatchPlayerResultsJoined } from '@bf2-matchmaking/types';
import Link from 'next/link';

interface Props {
  playerResults: Array<MatchPlayerResultsJoined>;
  match: MatchesJoined;
}

export default function TeamResultTable({ playerResults, match }: Props) {
  const roundForConnect = match.rounds.at(0);
  return (
    <table className="table bg-base-100 shadow-xl">
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
        {playerResults.map((result, i) => (
          <tr key={result.player.id} className="hover">
            <th>{i + 1}</th>
            <td className="truncate">{result.player.full_name}</td>
            {result && (
              <>
                <td>{result.score}</td>
                <td>{result.kills}</td>
                <td>{result.deaths}</td>
              </>
            )}
            {!result && roundForConnect && (
              <>
                <td colSpan={2}>Unconnected</td>
                <td>
                  <Link
                    className="btn btn-xs btn-secondary float-right"
                    href={`/rounds/${roundForConnect.id}/connect`}
                  >
                    Connect
                  </Link>
                </td>
              </>
            )}
            {!result && !roundForConnect && <td colSpan={3}>Unconnected</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
