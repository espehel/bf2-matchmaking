import { MatchesJoined, ServerRconsRow, ServersRow } from './database-types';
import { LiveServerState, PlayerListItem, ServerInfo, User } from './index';

export enum MatchEvent {
  Summon = 'Summon',
  Draft = 'Draft',
}

export interface PostMatchEventRequestBody {
  event: MatchEvent;
  matchId: number;
}

export enum MatchConfigEvent {
  INSERT = 'Insert',
  UPDATE = 'Update',
  DELETE = 'Delete',
}

export interface PostMatchConfigEventRequestBody {
  event: MatchConfigEvent;
  channelId: string;
}

export interface PostCommandsReinstallRequestBody {
  guilds: Array<string>;
  commands: Array<string>;
}

export type LiveServerStatus = 'active' | 'idle' | 'offline' | 'lacking';

export interface LiveServer {
  address: string;
  name: string;
  live: LiveInfo | null;
  port: number;
  status: LiveServerStatus;
  noVehicles: boolean | null;
  matchId: number | null;
  joinmeHref: string;
  joinmeDirect: string;
  country: string | null;
  city: string | null;
  updatedAt?: string;
  errorAt?: string;
}

export interface ConnectedLiveServer extends LiveServer {
  status: 'active' | 'idle';
  live: LiveInfo;
}

export interface LiveInfo extends ServerInfo {
  players: Array<PlayerListItem>;
}

export interface PostMatchesRequestBody {
  config: number;
  team1: Array<User>;
  team2: Array<User>;
  serverIp: string;
}

export interface PostServersRequestBody {
  ip: string;
  port: string;
  rcon_pw: string;
  rcon_port: string;
}
export interface PostServersResponseBody {
  info: ServerInfo;
  server: ServersRow;
  rcon: ServerRconsRow;
}

export interface PostServerExecRequestBody {
  cmd: 'admin.restartMap' | 'quit';
}

export interface PostServerExecResponseBody {
  reply: string;
}

export interface PostServerPlayersSwitchRequestBody {
  players: Array<string>;
}

export type PostMatchResult = MatchesJoined;

export interface LiveMatch {
  matchId: number;
  state: LiveServerState;
  roundsPlayed: number;
  pendingSince?: string | null;
  live_at?: string | null;
  server: LiveServer | null;
}

export interface ActiveLiveMatch extends LiveMatch {
  server: LiveServer;
}

export interface PostDemosRequestBody {
  server: string;
  demos: Array<string>;
}
export interface PostDemosResponseBody {
  channel: string;
  message: string;
}
