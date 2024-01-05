import {
  MatchesJoined,
  MatchServer,
  PlayersRow,
  RoundsInsert,
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

export interface RconBf2Server extends ServersRow {
  info: LiveInfo | null;
  match: MatchesJoined | null;
  joinmeHref: string;
  joinmeDirect: string;
  country: string | null;
  city: string | null;
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

export interface PostRconRequestBody {
  host: string;
  port: string;
  password: string;
  persist?: boolean;
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

export type GetMatchLiveResponseBody = {
  liveInfo: LiveInfo | null;
  liveState: LiveServerState;
  matchId: number;
  players: Array<PlayersRow>;
  server: MatchServer | null;
};

export interface PostDemosRequestBody {
  server: string;
  demos: Array<string>;
}
export interface PostDemosResponseBody {
  channel: string;
  message: string;
}
