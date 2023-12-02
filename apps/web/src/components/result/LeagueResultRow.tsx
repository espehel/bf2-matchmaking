import {
  isDefined,
  MatchResultsRow,
  MatchStatus,
  TeamsRow,
} from '@bf2-matchmaking/types';
import Link from 'next/link';

interface Props {
  matchId: number;
  status: MatchStatus;
  results: Array<MatchResultsRow>;
  homeTeam: TeamsRow;
  awayTeam: TeamsRow;
}

export default function LeagueResultRow({
  results,
  homeTeam,
  awayTeam,
  matchId,
  status,
}: Props) {
  const homeResult = results.find((r) => r.team === homeTeam.id);
  const awayResult = results.find((r) => r.team === awayTeam.id);
  const matchHref =
    status === MatchStatus.Scheduled || status === MatchStatus.Ongoing
      ? `/matches/${matchId}`
      : `/results/${matchId}`;
  return (
    <tr>
      <td>
        <Link href={matchHref}>{`Match ${matchId}`}</Link>
      </td>
      <td className="font-bold">
        <div>{homeTeam.name}</div>
        <div>{awayTeam.name}</div>
      </td>
      <td>
        <div>{getMaps(homeResult)}</div>
        <div>{getMaps(awayResult)}</div>
      </td>
      <td>
        <div>{getTickets(homeResult)}</div>
        <div>{getTickets(awayResult)}</div>
      </td>
      <td className="font-bold">
        <div>{getPoints(homeResult)}</div>
        <div>{getPoints(awayResult)}</div>
      </td>
    </tr>
  );
}

function getMaps(result?: MatchResultsRow) {
  return isDefined(result) ? result.maps.toString() : '---';
}
function getTickets(result?: MatchResultsRow) {
  return isDefined(result) ? result.tickets.toString() : '---';
}
function getPoints(result?: MatchResultsRow) {
  if (isDefined(result)) {
    return (result.is_winner ? result.maps + 1 : result.maps).toString();
  }
  return '---';
}
