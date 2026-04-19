'use client';
import { useEffect, useState } from 'react';
import { GameStatus, LiveInfo } from '@bf2-matchmaking/types';
import { formatSecToMin } from '@bf2-matchmaking/utils';
import { formatServerMapName } from '@bf2-matchmaking/utils/map';
import RoundTable from '@/components/RoundTable';
import { LiveServerState } from '@bf2-matchmaking/types';
import { api } from '@bf2-matchmaking/services/clientApi';

interface Props {
  address: string;
  initialInfo: LiveInfo;
  matchState: LiveServerState;
  roundsPlayed: number | undefined;
  vehicleMode: string;
  joinmeHref: string | undefined;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export default function LiveServerInfo({
  address,
  initialInfo,
  matchState,
  roundsPlayed,
  vehicleMode,
  joinmeHref,
}: Props) {
  const [live, setLive] = useState<LiveInfo>(initialInfo);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');

  useEffect(() => {
    const es = api.getServerLiveStream(address);

    console.log('adding listener');
    es.addEventListener('data', (event) => {
      try {
        setLive(JSON.parse(event.data));
      } catch {
        // ignore malformed events
      }
    });

    es.addEventListener('heartbeat', () => {
      setStatus('connected');
    });

    es.onopen = () => {
      setStatus('connected');
    };

    es.onerror = () => {
      setStatus('disconnected');
    };

    return () => {
      console.log('closing');
      es.close();
    };
  }, [address]);

  const isPaused = live.currentGameStatus === GameStatus.Paused;

  return (
    <>
      <div className="flex items-center gap-2 mt-2">
        <span
          className={`badge badge-xs ${status === 'connected' ? 'badge-success' : status === 'connecting' ? 'badge-warning' : 'badge-error'}`}
        />
        <span className="text-xs text-base-content/50">
          {status === 'connected'
            ? 'Live'
            : status === 'connecting'
              ? 'Connecting...'
              : 'Disconnected'}
        </span>
      </div>
      <div className="grid grid-cols-[repeat(6,auto)] gap-x-4 gap-y-1 text-sm mt-2 w-fit">
        <span>Match status</span>
        <div>
          <div className="inline-grid *:[grid-area:1/1] mr-1">
            <div className={`status animate-ping ${getStatusColor(matchState)}`} />
            <div className={`status ${getStatusColor(matchState)}`} />
          </div>
          {matchState}
        </div>
        <span className="text-base-content/70">Map</span>
        <span>{formatServerMapName(live.currentMapName)}</span>
        <span className="text-base-content/70">Players</span>
        <span>
          {live.connectedPlayers}/{live.maxPlayers}
        </span>
        <span className="text-base-content/70">Rounds played</span>
        <span>{roundsPlayed}</span>
        <span className="text-base-content/70">Mode</span>
        <span>{vehicleMode}</span>
        <span className="text-base-content/70">Round status</span>
        <span>{getGameStatusLabel(live.currentGameStatus)}</span>
      </div>
      {joinmeHref && (
        <a
          href={joinmeHref}
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
