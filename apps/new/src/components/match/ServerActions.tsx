'use client';
import { GameStatus, MatchesJoined, RconBf2Server } from '@bf2-matchmaking/types';
import { formatSecToMin } from '@bf2-matchmaking/utils';
import { getKey } from '@bf2-matchmaking/utils/src/object-utils';
import { pauseRound, restartRound, unpauseRound } from '@/app/matches/[match]/actions';
import AsyncActionButton from '@/components/AsyncActionButton';
import { useServerRestart } from '@/state/server-hooks';

interface Props {
  match: MatchesJoined;
  server: RconBf2Server | null;
}

export default function ServerActions({ match, server }: Props) {
  const [isRestarting, handleRestartServerAction] = useServerRestart(match, server);

  if (isRestarting) {
    return <p className="font-bold text-info">Server is restarting...</p>;
  }

  if (!server || !server.info) {
    return <p className="font-bold text-error">Server connection failed...</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-2">
        <div>{`Game status: ${getKey(GameStatus, server.info.currentGameStatus)}`}</div>
        <div>{`Players: ${server.info.connectedPlayers}`}</div>
        <div>{`Map: ${server.info.currentMapName}`}</div>
        <div>{`Round time: ${formatSecToMin(server.info.roundTime)}`}</div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">
        <AsyncActionButton
          action={handleRestartServerAction}
          errorMessage="Failed to restart server"
          successMessage="Restarting server"
        >
          Restart server
        </AsyncActionButton>
        <AsyncActionButton
          action={() => restartRound(match.id, server.ip)}
          errorMessage="Failed to restart round"
          successMessage="Round restarted"
        >
          Restart round
        </AsyncActionButton>
        {server.info.currentGameStatus === GameStatus.Playing && (
          <AsyncActionButton
            action={() => pauseRound(match.id, server.ip)}
            errorMessage="Failed to pause round"
            successMessage="Round paused"
          >
            Pause
          </AsyncActionButton>
        )}
        {server.info.currentGameStatus === GameStatus.Paused && (
          <AsyncActionButton
            action={() => unpauseRound(match.id, server.ip)}
            errorMessage="Failed to unpause round"
            successMessage="Round unpaused"
          >
            Unpause
          </AsyncActionButton>
        )}
        <button className="btn btn-primary w-fit" disabled>
          Change map
        </button>
        <button className="btn btn-primary w-fit" disabled>
          Set teams
        </button>
      </div>
    </div>
  );
}
