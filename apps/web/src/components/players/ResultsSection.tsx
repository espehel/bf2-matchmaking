import { PlayerResultInfo, PlayersRow } from '@bf2-matchmaking/types';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/supabase';
import PlayerResultItem from '@/components/players/PlayerResultItem';
import PlayerResultItemOld from '@/components/players/PlayerResultItemOld';
import { parseJSON } from '@bf2-matchmaking/utils/src/json-utils';

interface Props {
  player: PlayersRow;
}
export default async function ResultsSection({ player }: Props) {
  const { data: playerResults } = await supabase(cookies).getJoinedPlayerResults(
    player.id
  );
  const { data: ratings } = await supabase(cookies).getPlayerRatings(player.id);

  if (!playerResults || !playerResults.length || !ratings || !ratings.length) {
    return null;
  }
  return (
    <section>
      <h2 className="text-xl font-bold mb-2">Ratings:</h2>
      <div className="flex gap-2">
        <aside>
          <div className="stats stats-vertical shadow">
            {ratings.map((rating) => (
              <div key={rating.config.id} className="stat">
                <div className="stat-value">{rating.rating}</div>
                <div className="stat-desc">{rating.config.name}</div>
              </div>
            ))}
          </div>
        </aside>
        <ul>
          {playerResults.map((playerResult) =>
            playerResult.info ? (
              <PlayerResultItem
                key={playerResult.match_id}
                playerResult={playerResult}
                info={playerResult.info}
              />
            ) : (
              <PlayerResultItemOld
                key={playerResult.match_id}
                playerResult={playerResult}
              />
            )
          )}
        </ul>
      </div>
    </section>
  );
}
