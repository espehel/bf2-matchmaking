import { GatherPlayer, MatchesJoined } from './database-types';

export enum GatherStatus {
  Queueing,
  Summoning,
  Playing,
  Aborting,
  Failed,
}

export interface GatherState extends Record<string, string | number | undefined> {
  status: number;
  matchId: string | undefined;
  summoningAt: string | undefined;
}
export interface StatusChange {
  prevStatus: GatherStatus | null;
  status: GatherStatus;
  payload: unknown;
}
export interface PlayingStatusChange extends StatusChange {
  status: GatherStatus.Playing;
  payload: MatchesJoined;
}
export interface AbortingStatusChange extends StatusChange {
  status: GatherStatus.Aborting;
  payload: Array<GatherPlayer>;
}
export interface QueueingStatusChange extends StatusChange {
  status: GatherStatus.Queueing;
  payload: null;
}
