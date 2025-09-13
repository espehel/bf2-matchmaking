import { GameStatus, MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { pauseRound, restartRound, unpauseRound } from '@/app/matches/[match]/actions';
import ActionButton from '@/components/ActionButton';
import ChangeMapForm from '@/components/matches/ChangeMapForm';
import { RestartServerButton } from '@/components/matches/server/RestartServerButton';
import { supabase } from '@/lib/supabase/supabase-server';
import { cookies } from 'next/headers';
import { ConnectedLiveServer } from '@bf2-matchmaking/types/server';

interface Props {
  server: ConnectedLiveServer;
  match: MatchesJoined;
}

export default async function ServerActions({ server, match }: Props) {
  const cookieStore = await cookies();
  const isMatchPlayer = await supabase(cookieStore).isMatchPlayer(match);

  if (!isMatchPlayer || match.status !== MatchStatus.Ongoing) {
    return null;
  }

  const restartRoundSA = async () => {
    'use server';
    return restartRound(match.id, server.address);
  };
  const pauseRoundSA = async () => {
    'use server';
    return pauseRound(match.id, server.address);
  };

  const unpauseRoundSA = async () => {
    'use server';
    return unpauseRound(match.id, server.address);
  };

  return (
    <div>
      <div className="divider mt-0" />
      <div className="flex flex-wrap gap-2 mt-4">
        <RestartServerButton server={server} matchId={match.id} />
        <ActionButton
          formAction={restartRoundSA}
          errorMessage="Failed to restart round"
          successMessage="Round restarted"
        >
          Restart round
        </ActionButton>
        {server.live.currentGameStatus === GameStatus.Playing && (
          <ActionButton
            formAction={pauseRoundSA}
            errorMessage="Failed to pause round"
            successMessage="Round paused"
          >
            Pause
          </ActionButton>
        )}
        {server.live.currentGameStatus === GameStatus.Paused && (
          <ActionButton
            formAction={unpauseRoundSA}
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
      <ChangeMapForm server={server} />
    </div>
  );
}
