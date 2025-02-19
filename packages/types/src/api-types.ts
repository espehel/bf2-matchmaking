import { GatherPlayer, MatchesInsert, MatchPlayersInsert } from './database-types';
import { LiveServerState, PlayerListItem, ServerInfo } from './index';
import { LiveServer } from './server';
import { GatherState } from './gather';
import { StreamEventReply } from './redis';

export interface SessionUser {
  id: string;
  nick: string;
  keyhash: string;
}

export type AccessRoles =
  | 'system'
  | 'user'
  | 'player-admin'
  | 'match-admin'
  | 'server-admin';

export interface LiveInfo extends ServerInfo {
  players: Array<PlayerListItem>;
}

export interface PostServersRequestBody {
  ip: string;
  port: string;
  rcon_pw: string;
  rcon_port: string;
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

export interface PostMatchRequestBody {
  matchValues: MatchesInsert;
  matchMaps: Array<number> | null;
  matchTeams: Array<MatchPlayersInsert> | null;
}

export interface GetGatherResponse {
  state: GatherState;
  players: Array<GatherPlayer>;
  events: Array<StreamEventReply>;
}
