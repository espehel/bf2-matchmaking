import {
  GameStatus,
  MatchesJoined,
  MatchStatus,
  ServersRow,
} from '@bf2-matchmaking/types';
import { pauseRound, restartRound, unpauseRound } from '@/app/matches/[match]/actions';
import ActionButton from '@/components/ActionButton';
import ChangeMapForm from '@/components/matches/ChangeMapForm';
import { RestartServerButton } from '@/components/matches/server/RestartServerButton';
import { supabase } from '@/lib/supabase/supabase';
import { cookies } from 'next/headers';
import { api } from '@bf2-matchmaking/utils';

interface Props {
  server: ServersRow;
  match: MatchesJoined;
}

export default async function ServerActions({ server, match }: Props) {
  const { data } = await api.live().getServer(server.ip);
  const serverInfo = data?.info;
  const isMatchOfficer = await supabase(cookies).isMatchOfficer(match);

  if (!isMatchOfficer || match.status !== MatchStatus.Ongoing) {
    return null;
  }

  if (!data || !serverInfo) {
    return (
      <div>
        <div className="divider mt-0" />
        <p className="font-bold text-error">Server connection failed...</p>
      </div>
    );
  }

  const restartRoundSA = async () => {
    'use server';
    return restartRound(match.id, server.ip);
  };
  const pauseRoundSA = async () => {
    'use server';
    return pauseRound(match.id, server.ip);
  };

  const unpauseRoundSA = async () => {
    'use server';
    return unpauseRound(match.id, server.ip);
  };

  return (
    <div>
      <div className="divider mt-0" />
      <div className="flex flex-wrap gap-2 mt-4">
        <RestartServerButton server={data} matchId={match.id} />
        <ActionButton
          action={restartRoundSA}
          errorMessage="Failed to restart round"
          successMessage="Round restarted"
        >
          Restart round
        </ActionButton>
        {serverInfo.currentGameStatus === GameStatus.Playing && (
          <ActionButton
            action={pauseRoundSA}
            errorMessage="Failed to pause round"
            successMessage="Round paused"
          >
            Pause
          </ActionButton>
        )}
        {serverInfo.currentGameStatus === GameStatus.Paused && (
          <ActionButton
            action={unpauseRoundSA}
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
      <ChangeMapForm server={data} />
    </div>
  );
}
