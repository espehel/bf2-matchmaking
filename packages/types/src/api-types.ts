import {
  MatchesJoined,
  MatchServers,
  PlayersRow,
  RoundsInsert,
  ServerRconsRow,
  ServersJoined,
  ServersRow,
} from './database-types';
import {
  DnsRecord,
  Instance,
  LiveRound,
  LiveServerState,
  PlayerListItem,
  ServerInfo,
  User,
} from './index';
import { DateTime } from 'luxon';

export enum ApiErrorType {
  NotVoiceChannel = 'NOT_VOICE_CHANNEL',
  NoMatchStagingChannel = 'NO_MATCH_STAGING_CHANNEL',
  NoMatchDiscordChannel = 'NO_MATCH_DISCORD_CHANNEL',
}

export class ApiError extends Error {
  status: number;
  constructor(type: ApiErrorType) {
    super(type);
    switch (type) {
      case ApiErrorType.NoMatchStagingChannel:
      case ApiErrorType.NotVoiceChannel:
      case ApiErrorType.NoMatchDiscordChannel:
        this.status = 400;
        break;
      default:
        this.status = 500;
    }
  }
}

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

export interface LiveServer {
  address: string;
  port: number;
  info: LiveInfo;
  noVehicles: boolean;
  matchId: number | null;
  joinmeHref: string;
  joinmeDirect: string;
  country: string | null;
  city: string | null;
  updatedAt: string | null;
  errorAt: string | null;
}

export interface LiveInfo extends ServerInfo {
  ip: string;
  players: Array<PlayerListItem>;
}

export interface PostMatchesRequestBody {
  config: number;
  team1: Array<User>;
  team2: Array<User>;
  serverIp: string;
}

export interface PostServersRequestBody {
  host: string;
  port: string;
  password: string;
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

export type LiveMatch = {
  liveInfo: LiveInfo | null;
  liveState: LiveServerState;
  matchId: number;
  players: Array<PlayersRow>;
  server: ServersRow | null;
};

export interface PostDemosRequestBody {
  server: string;
  demos: Array<string>;
}
export interface PostDemosResponseBody {
  channel: string;
  message: string;
}
