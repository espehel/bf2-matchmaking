export type LiveServerState =
  | 'pending'
  | 'warmup'
  | 'prelive'
  | 'live'
  | 'endlive'
  | 'finished'
  | 'stale';

export interface MatchLive {
  state: LiveServerState;
  roundsPlayed: string;
  pendingSince?: string | null;
}

export type AppEngineState = Record<
  string,
  Partial<MatchLive> & {
    matchId: string;
    status: 'ok' | 'error';
    error: string | null;
    updatedAt: string;
  }
> & {
  idleServerTask?: {
    status: 'ok' | 'error';
    error: string | null;
    updated: number | null;
    updatedAt: string;
  };
};
