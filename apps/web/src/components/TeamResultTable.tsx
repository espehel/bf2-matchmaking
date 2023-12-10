import {
  MatchesJoined,
  MatchPlayerResultsJoined,
  PlayersRow,
} from '@bf2-matchmaking/types';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';

interface Props {
  playerResults: Array<MatchPlayerResultsJoined>;
  match: MatchesJoined;
}

export default async function TeamResultTable({ playerResults }: Props) {
  const { data: player } = await supabase(cookies).getSessionPlayer();
  const { data: adminRoles } = await supabase(cookies).getAdminRoles();
  const showRatingCol =
    adminRoles?.player_admin ||
    playerResults.some(
      ({ player_id, rating_inc }) => player_id === player?.id && rating_inc
    );
  if (playerResults.length === 0) {
    return null;
  }
  return (
    <table className="table bg-base-100 shadow-xl">
      <thead>
        <tr>
          <th />
          <th>Name</th>
          <th>Score</th>
          <th>Kills</th>
          <th>Deaths</th>
          {showRatingCol && <th>Rating</th>}
        </tr>
      </thead>
      <tbody>
        {playerResults.map((result, i) => (
          <tr key={result.player.id} className="hover">
            <th>{i + 1}</th>
            <td className="truncate">{result.player.nick}</td>
            {result && (
              <>
                <td>{result.score}</td>
                <td>{result.kills}</td>
                <td>{result.deaths}</td>
                <RatingCell
                  result={result}
                  player={player}
                  isAdmin={Boolean(adminRoles?.player_admin)}
                />
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface RatingCellProps {
  result: MatchPlayerResultsJoined;
  player: PlayersRow | null;
  isAdmin: boolean;
}
async function RatingCell({ result, player, isAdmin }: RatingCellProps) {
  if (!((player?.id === result.player_id || isAdmin) && result.rating_inc)) {
    return null;
  }

  return (
    <td className={`font-bold ${result.rating_inc > 0 ? 'text-success' : 'text-error'}`}>
      {result.rating_inc}
    </td>
  );
}
