'use client';
import { MatchConfigsRow, PlayerRatingsRow, PlayersRow } from '@bf2-matchmaking/types';
import FileInput from '@/components/commons/FileInput';
import { useCallback, useMemo, useState } from 'react';
import { isNotTestPlayer } from '@bf2-matchmaking/utils';
import { upsertRatingsForConfig } from '@/app/admin/configs/[config]/ratings/actions';
import { toast } from 'react-toastify';
import PlayerRatingsCopyButton from '@/components/matches/PlayerRatingsCopyButton';

interface Props {
  ratings: Array<PlayerRatingsRow>;
  players: Array<PlayersRow>;
  config: MatchConfigsRow;
}

interface NewRating {
  nick?: string;
  rating?: number;
  player_id?: string;
}

type PlayerTuple = [PlayersRow, number | undefined, number | undefined];
//TODO filter players based on matchid
// ADD rating stars to edit players directly
export default function ManageRatingsSection({ ratings, config, players }: Props) {
  const [nextRatings, setNextRatings] = useState<NewRating[]>([]);
  const [sortBy, setSortBy] = useState('rating');

  const handleFileChange = useCallback((text: string) => {
    setNextRatings(parseRatings(text));
  }, []);

  const comparePlayerTuple = useCallback(
    ([p1, r1, nr1]: PlayerTuple, [p2, r2, nr2]: PlayerTuple) => {
      if (sortBy === 'rating') {
        return (r2 || -1) - (r1 || -1);
      }
      if (sortBy === 'id') {
        return p1.id.localeCompare(p2.id);
      }
      if (sortBy === 'nick') {
        return p1.nick.localeCompare(p2.nick);
      }
      if (sortBy === 'nextRating') {
        return (nr2 || -1) - (nr1 || -1);
      }
      return 0;
    },
    [sortBy]
  );

  const playerTuples = useMemo(
    () =>
      players.filter(isNotTestPlayer).map<PlayerTuple>((p) => {
        const currentRating = ratings.find((r) => r.player_id === p.id);
        const nextRating = nextRatings.find(
          (nr) => nr.player_id === p.id || nr.nick === p.nick
        );
        return [p, currentRating?.rating, nextRating?.rating];
      }),
    [nextRatings, ratings, players]
  );

  const sortedTuples = useMemo(
    () => [...playerTuples].sort(comparePlayerTuple),
    [playerTuples, sortBy, comparePlayerTuple]
  );

  const handleUpdateRatings = useCallback(async () => {
    const { error } = await upsertRatingsForConfig(
      config.id,
      playerTuples
        .filter(([, , nr]) => Boolean(nr))
        .map(([p, , nr]) => ({
          player_id: p.id,
          rating: nr,
        }))
    );
    if (error) {
      toast.error(`Failed to update ratings. (${error.message})`);
    } else {
      toast.success('Ratings updated');
    }
  }, [playerTuples, config]);

  return (
    <section className="section flex">
      <h2>Upload new ratings</h2>
      <p>
        {`File must be in csv format. Needs to contain the header 'rating' and one of
          'player_id' and 'nick'.`}
      </p>
      <div className="flex flex-row gap-2">
        <FileInput onFileChange={handleFileChange} />
        <button
          className="btn btn-primary"
          onClick={handleUpdateRatings}
          disabled={!config.fixed_ratings}
        >
          Update ratings
        </button>
        <PlayerRatingsCopyButton players={sortedTuples} />
      </div>
      <div className="grow">
        <table className="table table-lg">
          <thead>
            <tr>
              <th>
                <button onClick={() => setSortBy('id')}>Id</button>
                {sortBy === 'id' && <span className="ml-2">▼</span>}
              </th>
              <th>
                <button onClick={() => setSortBy('nick')}>Nick</button>
                {sortBy === 'nick' && <span className="ml-2">▼</span>}
              </th>
              <th>
                <button onClick={() => setSortBy('rating')}>Rating</button>
                {sortBy === 'rating' && <span className="ml-2">▼</span>}
              </th>
              <th>
                <button onClick={() => setSortBy('nextRating')}>Next rating</button>
                {sortBy === 'nextRating' && <span className="ml-2">▼</span>}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTuples.map(([player, rating, nextRating]) => (
              <tr key={player.id}>
                <td>{player.id}</td>
                <td>{player.nick}</td>
                <td>{rating || ''}</td>
                <td>{nextRating || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function parseRatings(text: string): Array<NewRating> {
  const lines = text.split(/[\r\n]+/);
  const header = lines[0].split(',');
  const nick = header.indexOf('nick');
  const rating = header.indexOf('rating');
  const player_id = header.indexOf('player_id');
  return lines.splice(1).map((line) => {
    const values = line.split(',');
    return {
      nick: values[nick],
      rating: Number(values[rating]),
      player_id: values[player_id],
    };
  });
}
