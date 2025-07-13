'use client';
import { MatchplayersRow } from '@bf2-matchmaking/schemas/types';
import { useAction } from '@/hooks/useAction';
import { updateMatchPlayer } from '@/app/matches/[match]/players/actions';
import { ChangeEvent, useCallback } from 'react';

interface Props {
  matchPlayer: MatchplayersRow;
  ratings: Array<number>;
}

export function MatchPlayerRatingFormAction({ matchPlayer, ratings }: Props) {
  const { trigger, isPending } = useAction(updateMatchPlayer);
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) =>
      trigger({
        matchId: matchPlayer.match_id,
        playerId: matchPlayer.player_id,
        rating: Number(e.target.value),
      }),
    [trigger, matchPlayer]
  );

  return (
    <div className="rating">
      {ratings.map((rating, i) => (
        <input
          key={rating}
          type="radio"
          name={`rating${matchPlayer.player_id}`}
          className="mask mask-star"
          aria-label={`${i + 1} star`}
          value={rating}
          defaultChecked={matchPlayer.rating === rating}
          onChange={handleChange}
          disabled={isPending}
        />
      ))}
    </div>
  );
}
