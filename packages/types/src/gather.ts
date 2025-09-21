import { GatherPlayer, MatchesJoined } from './database-types';
import { StreamEventReply } from './redis';

export enum GatherStatus {
  Queueing = 'Queueing',
  Summoning = 'Summoning',
  Starting = 'Starting',
  Aborting = 'Aborting',
  Failed = 'Failed',
}

export interface GatherState extends Record<string, string | number | undefined> {
  status: GatherStatus;
  address: string;
  summonedAt?: number;
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
  payload: { address: string };
}
export interface StartingStatusChange extends StatusChange {
  status: GatherStatus.Starting;
  payload: MatchesJoined;
}
export interface AbortingStatusChange extends StatusChange {
  status: GatherStatus.Aborting;
  payload: Array<GatherPlayer>;
}

export type InitatedGatherEvent = StreamEventReply<
  'initiated',
  { address: string; clientUIds: Array<string> }
>;
export type PlayerJoiningGatherEvent = StreamEventReply<
  'playerJoining',
  { clientUId: string; nick: string }
>;
export type PlayerJoiniedGatherEvent = StreamEventReply<
  'playerJoined',
  { clientUId: string; nick: string }
>;
export type PlayerRejectedGatherEvent = StreamEventReply<
  'playerRejected',
  { clientUId: string; reason: 'tsid' | 'keyhash'; nick: string }
>;
export type PlayerKickedGatherEvent = StreamEventReply<
  'playerKicked',
  { clientUId: string; reason: string; nick: string }
>;
export type PlayerLeftGatherEvent = StreamEventReply<
  'playerLeft',
  { clientUId: string; nick: string }
>;
export type PlayersSummonedGatherEvent = StreamEventReply<
  'playersSummoned',
  { address: string; clientUIds: Array<string> }
>;
export type SummonCompleteGatherEvent = StreamEventReply<
  'summonComplete',
  { clientUIds: Array<string> }
>;
export type PlayerMovedGatherEvent = StreamEventReply<
  'playerMoved',
  { clientUId: string; toChannel: string; nick: string }
>;
export type GatherStartedGatherEvent = StreamEventReply<
  'gatherStarted',
  { matchId: string }
>;
export type NextQueueGatherEvent = StreamEventReply<
  'nextQueue',
  { clientUIds: Array<string>; address: string }
>;
export type SummonFailGatherEvent = StreamEventReply<
  'summonFail',
  { missingClientUIds: Array<string> }
>;
export type GatherEvent =
  | InitatedGatherEvent
  | PlayerJoiningGatherEvent
  | PlayerJoiniedGatherEvent
  | PlayerRejectedGatherEvent
  | PlayerLeftGatherEvent
  | PlayersSummonedGatherEvent
  | PlayerKickedGatherEvent
  | SummonCompleteGatherEvent
  | PlayerMovedGatherEvent
  | GatherStartedGatherEvent
  | NextQueueGatherEvent
  | SummonFailGatherEvent;
