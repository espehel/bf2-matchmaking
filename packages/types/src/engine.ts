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
