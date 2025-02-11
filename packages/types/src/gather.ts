import { GatherPlayer, MatchesJoined } from './database-types';

export enum GatherStatus {
  Queueing = 'Queueing',
  Summoning = 'Summoning',
  Playing = 'Playing',
  Aborting = 'Aborting',
  Failed = 'Failed',
}

export interface GatherState extends Record<string, string | number | undefined> {
  status: GatherStatus;
  address: string;
  matchId?: string;
  summoningAt?: string;
  failReason?: string;
}
export interface StatusChange {
  prevStatus: GatherStatus | null;
  status: GatherStatus;
  payload: unknown;
}
export interface SummoningStatusChange extends StatusChange {
  status: GatherStatus.Summoning;
  payload: MatchesJoined;
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
  payload: { server: string; playerCount: number };
}
