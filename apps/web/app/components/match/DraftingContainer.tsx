import { useLoaderData, useSubmit } from '@remix-run/react';
import { useUser } from '@supabase/auth-helpers-react';
import { FC } from 'react';
import { loader } from '~/routes/matches/$matchId';
import ServerSelection from '~/components/match/ServerSelection';
import { teamIncludes } from '@bf2-matchmaking/utils';

const DraftingContainer: FC = () => {
  const { match, draftStep } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const user = useUser();
  const { captain, team, pool } = draftStep;

  const isCurrentCaptain = Boolean(captain && user && captain.user_id === user.id);

  const assignPlayer = (playerId: string, playerTeam: number) => () =>
    submit(
      { playerId, team: playerTeam.toString() },
      { method: 'post', action: `/matches/${match.id}/assign`, replace: true }
    );

  return (
    <article className="max-w-3xl mt-4 flex justify-between flex-wrap gap-4">
      <section className="section grow">
        <h2 className="text-xl">Player pool:</h2>
        <ul>
          {pool.map((player) => (
            <li key={player.id}>
              <span>{player.username}</span>
              {team && isCurrentCaptain && (
                <button
                  className="inline-block underline ml-2"
                  onClick={assignPlayer(player.id, team)}
                >
                  Pick
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="section grow">
        <h2 className="text-xl">Teams:</h2>
        <div className="flex gap-8">
          <div className="mb-2">
            <h3 className="text-lg">Team A</h3>
            <ul>
              {match.players.filter(teamIncludes(match, 'a')).map((player) => (
                <li key={player.id}>{player.username}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg">Team B</h3>
            <ul>
              {match.players.filter(teamIncludes(match, 'b')).map((player) => (
                <li key={player.id}>{player.username}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <ServerSelection />
    </article>
  );
};

export default DraftingContainer;
