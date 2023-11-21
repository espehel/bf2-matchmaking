import { useLoaderData } from '@remix-run/react';
import { loader } from '~/routes/matches/$matchId';
import { MatchPlayersRow } from '@bf2-matchmaking/types';
import RoundsList from '~/components/match/RoundsList';
import { FC } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import SigninSection from '~/components/match/SigninSection';
import { usePlayer } from '~/state/PlayerContext';

type PlayerTuple = [MatchPlayersRow, string];
const StartedContainer: FC = () => {
  const { match } = useLoaderData<typeof loader>();
  const user = useUser();
  const { isMatchPlayer } = usePlayer();

  const isTeam =
    (team: number) =>
    ([mp]: PlayerTuple) =>
      mp.team === team;

  const toPlayerTuple = (mp: MatchPlayersRow, i: number): PlayerTuple => [
    mp,
    match.players.find((player) => player.id === mp.player_id)?.username || `Player ${i}`,
  ];

  return (
    <div className="flex justify-around gap-4 flex-wrap">
      <section className="section grow w-1/2">
        <h2 className="text-xl">Teams:</h2>
        <div className="mb-2">
          <h3 className="text-lg">Team A</h3>
          <ul>
            {match.teams
              .map(toPlayerTuple)
              .filter(isTeam(1))
              .map(([mp, username]) => (
                <li key={mp.player_id}>{username}</li>
              ))}
          </ul>
        </div>
        <div>
          <h3 className="text-lg">Team B</h3>
          <ul>
            {match.teams
              .map(toPlayerTuple)
              .filter(isTeam(2))
              .map(([mp, username]) => (
                <li key={mp.player_id}>{username}</li>
              ))}
          </ul>
        </div>
      </section>
      {!user && <SigninSection />}
      <div className="grow w-1/3">
        <section className="section h-fit mb-4">
          <h2 className="text-xl">Maps:</h2>
          <ul>
            {match.maps.map(({ name, id }) => (
              <li key={id}>{name}</li>
            ))}
          </ul>
        </section>
        {match.server && isMatchPlayer(match) && (
          <section className="section h-fit">
            <h2 className="text-xl mb-4">Server: {match.server.name}</h2>
            <a
              className="filled-button"
              href={`https://joinme.click/g/bf2/${match.server.ip}:${match.server.port}`}
              target="_blank"
            >
              BF2 Join Me
            </a>
          </section>
        )}
      </div>
      <RoundsList />
    </div>
  );
};

export default StartedContainer;
