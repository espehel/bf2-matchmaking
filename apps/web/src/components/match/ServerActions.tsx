'use client';
import { GameStatus, MatchesJoined, RconBf2Server } from '@bf2-matchmaking/types';
import {
  pauseRound,
  restartRound,
  setTeams,
  unpauseRound,
} from '@/app/matches/[match]/actions';
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
        {/*<AsyncActionButton
          action={() => setTeams(match, server.ip)}
          errorMessage="Failed to set teams"
          successMessage="Teams set"
        >
          Set teams
        </AsyncActionButton>*/}
      </div>
    </div>
  );
}
