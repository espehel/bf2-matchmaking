'use client';
import {
  GameStatus,
  MapsRow,
  MatchesJoined,
  RconBf2Server,
} from '@bf2-matchmaking/types';
import { pauseRound, restartRound, unpauseRound } from '@/app/matches/[match]/actions';
import ActionButton from '@/components/ActionButton';
import { useServerRestart } from '@/state/server-hooks';
import ChangeMapForm from '@/components/match/ChangeMapForm';

interface Props {
  match: MatchesJoined;
  server: RconBf2Server | null;
  maps: Array<MapsRow> | null;
}

export default function ServerActions({ match, server, maps }: Props) {
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
        <ActionButton
          action={handleRestartServerAction}
          errorMessage="Failed to restart server"
          successMessage="Restarting server"
        >
          Restart server
        </ActionButton>
        <ActionButton
          action={() => restartRound(match.id, server.ip)}
          errorMessage="Failed to restart round"
          successMessage="Round restarted"
        >
          Restart round
        </ActionButton>
        {server.info.currentGameStatus === GameStatus.Playing && (
          <ActionButton
            action={() => pauseRound(match.id, server.ip)}
            errorMessage="Failed to pause round"
            successMessage="Round paused"
          >
            Pause
          </ActionButton>
        )}
        {server.info.currentGameStatus === GameStatus.Paused && (
          <ActionButton
            action={() => unpauseRound(match.id, server.ip)}
            errorMessage="Failed to unpause round"
            successMessage="Round unpaused"
          >
            Unpause
          </ActionButton>
        )}
        {/*<AsyncActionButton
          action={() => setTeams(match, server.ip)}
          errorMessage="Failed to set teams"
          successMessage="Teams set"
        >
          Set teams
        </AsyncActionButton>*/}
      </div>
      {maps && <ChangeMapForm server={server} maps={maps} />}
    </div>
  );
}
