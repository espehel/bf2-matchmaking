import { GameStatus, LiveInfo } from '@bf2-matchmaking/types';
import JoinMeButton from '@/components/servers/JoinMeButton';
import { pauseRound, restartRound, unpauseRound } from '@/app/servers/[server]/actions';
import ActionButton from '@/components/ActionButton';
import ChangeMapForm from '@/components/matches/ChangeMapForm';
import { ConnectedLiveServer } from '@bf2-matchmaking/types/server';

interface Props {
  server: ConnectedLiveServer;
  isConnected: boolean;
  hasAdmin: boolean;
}

export default async function ServerInGameActions({
  server,
  isConnected,
  hasAdmin,
}: Props) {
  const isPaused = server.live.currentGameStatus === GameStatus.Paused;
  const isInGameAdmin = isConnected || hasAdmin;

  const restartRoundSA = async () => {
    'use server';
    return restartRound(server.address);
  };
  const pauseRoundSA = async () => {
    'use server';
    return pauseRound(server.address);
  };

  const unpauseRoundSA = async () => {
    'use server';
    return unpauseRound(server.address);
  };

  return (
    <section className="section grow">
      <h2>Game Actions</h2>
      <div className="flex flex-row-reverse gap-4">
        <div className="flex flex-col gap-2">
          <JoinMeButton server={server} disabled={isConnected} />
          <ActionButton
            action={restartRoundSA}
            errorMessage="Failed to restart round"
            successMessage="Round restarted"
            disabled={!isInGameAdmin}
            fit="w-full"
          >
            Restart round
          </ActionButton>
          <ActionButton
            action={pauseRoundSA}
            errorMessage="Failed to pause round"
            successMessage="Round paused"
            disabled={!isInGameAdmin || isPaused}
            fit="w-full"
          >
            Pause
          </ActionButton>
          <ActionButton
            action={unpauseRoundSA}
            errorMessage="Failed to unpause round"
            successMessage="Round unpaused"
            disabled={!isInGameAdmin || !isPaused}
            fit="w-full"
          >
            Unpause
          </ActionButton>
          <ChangeMapForm server={server} />
        </div>
        <div className="grow">
          <PlayersSection info={server.live} />
        </div>
      </div>
    </section>
  );
}

function PlayersSection({ info }: { info: LiveInfo }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grow border border-accent rounded p-4 overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Id</th>
              <th>Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {info.players.map((p) => (
              <tr key={p.index}>
                <td>{p.index}</td>
                <td>{p.getName}</td>
                <td>{p.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {info.players.length === 0 && (
          <div className="p-2 font-bold">Empty server...</div>
        )}
      </div>
      <p>{`Players: ${info.connectedPlayers}/${info.maxPlayers}`}</p>
    </div>
  );
}
