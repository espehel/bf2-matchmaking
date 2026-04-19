import { Card } from '@/components/commons/card/Card';
import { api as internalApi } from '@bf2-matchmaking/utils';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/supabase-server';
import { GameStatus, MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import ActionButton from '@/components/ActionButton';
import { pauseRound, restartRound, unpauseRound } from '@/app/matches/[match]/actions';
import { LiveServer } from '@bf2-matchmaking/types/server';
import { RestartServerAction } from '@/components/matches/match/RestartServerAction';
import ChangeMapForm from '@/components/matches/ChangeMapForm';
import LiveServerInfo from '@/components/matches/match/LiveServerInfo';

interface Props {
  match: MatchesJoined;
}

export async function LiveServerCard({ match }: Props) {
  if (match.status !== MatchStatus.Ongoing) {
    return null;
  }
  const { data: liveMatch } = await internalApi.v2.getMatch(match.id);
  const cookieStore = await cookies();
  const isMatchPlayer = await supabase(cookieStore).isMatchPlayer(match);
  const { data: adminRoles } = await supabase(cookieStore).getAdminRoles();
  const hasAdmin =
    isMatchPlayer ||
    adminRoles?.match_admin ||
    adminRoles?.server_admin ||
    adminRoles?.system_admin;
  console.log({ liveMatch });
  if (!liveMatch || !liveMatch.server) {
    return null;
  }

  const server = liveMatch.server;
  const live = server.live;
  const isPaused = live?.currentGameStatus === GameStatus.Paused;

  async function pauseRoundSA() {
    'use server';
    if (!server) return { data: null, error: { message: 'No server connected' } };
    return pauseRound(match.id, server.address);
  }

  async function unpauseRoundSA() {
    'use server';
    if (!server) return { data: null, error: { message: 'No server connected' } };
    return unpauseRound(match.id, server.address);
  }

  async function restartRoundSA() {
    'use server';
    if (!server) return { data: null, error: { message: 'No server connected' } };
    return restartRound(match.id, server.address);
  }

  return (
    <Card title={server.name}>
      {live ? (
        <LiveServerInfo
          address={server.address}
          initialInfo={live}
          matchState={liveMatch.state}
          roundsPlayed={liveMatch?.roundsPlayed}
          vehicleMode={getVehicleMode(server)}
          joinmeHref={server?.data?.joinmeHref}
        />
      ) : (
        <p className="text-base-content/70">No live data available</p>
      )}
      {hasAdmin && server && (
        <>
          <div className="divider divider-start">Server actions</div>
          <div className="flex flex-wrap gap-4">
            {isPaused ? (
              <ActionButton
                formAction={unpauseRoundSA}
                successMessage="Round unpaused"
                errorMessage="Failed to unpause round"
              >
                Unpause
              </ActionButton>
            ) : (
              <ActionButton
                formAction={pauseRoundSA}
                successMessage="Round paused"
                errorMessage="Failed to pause round"
              >
                Pause
              </ActionButton>
            )}
            <ActionButton
              formAction={restartRoundSA}
              successMessage="Round restarted"
              errorMessage="Failed to restart round"
            >
              Restart round
            </ActionButton>
            <RestartServerAction
              server={server}
              matchId={match.id}
              isMatchPlayer={hasAdmin}
            />
            <ChangeMapForm server={server} />
          </div>
        </>
      )}
    </Card>
  );
}

function getVehicleMode(server: LiveServer) {
  if (!server.data) {
    return 'unknown';
  }
  return server.data.noVehicles ? 'Infantry' : 'Vehicles';
}
