import { Card } from '@/components/commons/card/Card';
import { api as internalApi, formatSecToMin } from '@bf2-matchmaking/utils';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase/supabase-server';
import {
  GameStatus,
  LiveServerState,
  MatchesJoined,
  MatchStatus,
} from '@bf2-matchmaking/types';
import RoundTable from '@/components/RoundTable';
import ActionButton from '@/components/ActionButton';
import { pauseRound, restartRound, unpauseRound } from '@/app/matches/[match]/actions';
import { formatServerMapName } from '@bf2-matchmaking/utils/map';
import { LiveServer } from '@bf2-matchmaking/types/server';
import { RestartServerAction } from '@/components/matches/match/RestartServerAction';

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
  console.log(liveMatch);
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
        <>
          <div className="grid grid-cols-[repeat(6,auto)] gap-x-4 gap-y-1 text-sm mt-2 w-fit">
            <span>Match status</span>
            <div>
              <div className="inline-grid *:[grid-area:1/1] mr-1">
                <div
                  className={`status animate-ping ${getStatusColor(liveMatch.state)}`}
                />
                <div className={`status ${getStatusColor(liveMatch.state)}`} />
              </div>
              {liveMatch.state}
            </div>
            <span className="text-base-content/70">Map</span>
            <span>{formatServerMapName(live.currentMapName)}</span>
            <span className="text-base-content/70">Players</span>
            <span>
              {live.connectedPlayers}/{live.maxPlayers}
            </span>
            <span className="text-base-content/70">Rounds played</span>
            <span>{liveMatch?.roundsPlayed}</span>
            <span className="text-base-content/70">Mode</span>
            <span>{getVehicleMode(server)}</span>
            <span className="text-base-content/70">Round status</span>
            <span>{getGameStatusLabel(live.currentGameStatus)}</span>
          </div>
          {server?.data?.joinmeHref && (
            <a
              href={server.data.joinmeHref}
              className="link link-secondary text-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join server
            </a>
          )}
          <div className="badge badge-xl badge-outline badge-primary flex justify-between text-sm font-semibold mt-2 mx-auto">
            <span>
              {live.team1_Name}: {live.team1_tickets}
            </span>
            <div className="divider divider-horizontal" />
            <span>{formatSecToMin(live.timeLeft)}</span>
            <div className="divider divider-horizontal" />
            <span>
              {live.team2_Name}: {live.team2_tickets}
            </span>
          </div>
          <RoundTable liveInfo={live} />
        </>
      ) : (
        <p className="text-base-content/70">No live data available</p>
      )}
      {hasAdmin && server && (
        <>
          <div className="divider divider-start">Server actions</div>
          <div className="flex flex-wrap gap-2">
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
          </div>
        </>
      )}
    </Card>
  );
}

function getStatusColor(state: LiveServerState): string {
  switch (state) {
    case 'live':
      return 'status-success';
    case 'warmup':
    case 'prelive':
      return 'status-info';
    case 'pending':
    case 'endlive':
      return 'status-warning';
    case 'stale':
      return 'status-error';
    default:
      return 'status-neutral';
  }
}

function getGameStatusLabel(status: string): string {
  switch (status) {
    case GameStatus.Playing:
      return 'Playing';
    case GameStatus.EndGame:
      return 'End game';
    case GameStatus.PreGame:
      return 'Pre-game';
    case GameStatus.Paused:
      return 'Paused';
    case GameStatus.RestartServer:
      return 'Restarting';
    case GameStatus.NotConnected:
      return 'Not connected';
    default:
      return 'Unknown';
  }
}

function getVehicleMode(server: LiveServer) {
  if (!server.data) {
    return 'unknown';
  }
  return server.data.noVehicles ? 'Infantry' : 'Vehicles';
}
