import { Database } from './database-types.generated';
import { TeamPlayer } from './index';

export type PlayersRow = Database['public']['Tables']['players']['Row'];
export type MapsRow = Database['public']['Tables']['maps']['Row'];
export type MatchesRow = Database['public']['Tables']['matches']['Row'];
export type MatchPlayersRow = Database['public']['Tables']['match_players']['Row'];
export type RoundsRow = Database['public']['Tables']['rounds']['Row'];
export type ServersRow = Database['public']['Tables']['servers']['Row'];
export type AdminRolesRow = Database['public']['Tables']['admin_roles']['Row'];
export type ServerRconsRow = Database['public']['Tables']['server_rcons']['Row'];
export type MatchResultsRow = Database['public']['Tables']['match_results']['Row'];
export type MatchPlayerResultsRow =
  Database['public']['Tables']['match_player_results']['Row'];
export type TeamsRow = Database['public']['Tables']['teams']['Row'];
export type TeamPlayersRow = Database['public']['Tables']['team_players']['Row'];

export type PlayersInsert = Database['public']['Tables']['players']['Insert'];
export type RoundsInsert = Database['public']['Tables']['rounds']['Insert'];
export type MatchesInsert = Database['public']['Tables']['matches']['Insert'];
export type ServersInsert = Database['public']['Tables']['servers']['Insert'];
export type ServerRconsInsert = Database['public']['Tables']['server_rcons']['Insert'];
export type MatchPlayersInsert = Database['public']['Tables']['match_players']['Insert'];
export type MatchResultsInsert = Database['public']['Tables']['match_results']['Insert'];
export type MatchPlayerResultsInsert =
  Database['public']['Tables']['match_player_results']['Insert'];
export type TeamsInsert = Database['public']['Tables']['teams']['Insert'];
export type TeamPlayersInsert = Database['public']['Tables']['team_players']['Insert'];

export type MatchesUpdate = Database['public']['Tables']['matches']['Update'];
export type PlayersUpdate = Database['public']['Tables']['players']['Update'];
export type ServersUpdate = Database['public']['Tables']['servers']['Update'];
export type ServerRconsUpdate = Database['public']['Tables']['server_rcons']['Update'];

export enum MatchStatus {
  Open = 'Open',
  Summoning = 'Summoning',
  Drafting = 'Drafting',
  Ongoing = 'Ongoing',
  Finished = 'Finished',
  Closed = 'Closed',
  Deleted = 'Deleted',
}
export enum DraftType {
  Captain = 'captain',
  Random = 'random',
}

export enum MapDraftType {
  Random = 'random',
}

export enum MatchConfigModeType {
  Inactive = 'inactive',
  Passive = 'passive',
  Active = 'active',
}

export interface MatchConfigsRow
  extends Omit<
    Database['public']['Tables']['match_configs']['Row'],
    'draft' | 'map_draft' | 'mode'
  > {
  draft: DraftType;
  map_draft: MapDraftType;
  mode: MatchConfigModeType;
}
export interface MatchesJoined
  extends Omit<MatchesRow, 'config' | 'server' | 'status' | 'home_team' | 'away_team'> {
  maps: Array<MapsRow>;
  players: Array<PlayersRow>;
  teams: Array<MatchPlayersRow>;
  server: ServersRow | null;
  status: MatchStatus;
  config: MatchConfigsRow;
  rounds: Array<RoundsJoined>;
  home_team: TeamsRow;
  away_team: TeamsRow;
}
export interface RoundsJoined extends Omit<RoundsRow, 'map' | 'server'> {
  map: MapsRow;
  server: ServersRow | null;
}

export interface ServersJoined extends ServersRow {
  matches: Array<{ id: number; status: string }>;
}

export type ServersWithRcon = ServerRconsRow & ServersRow;

export type QuickMatch = [MatchConfigsRow, MatchesJoined | null];

export interface DiscordConfig extends MatchConfigsRow {
  channel: string;
}

export interface DiscordMatch extends MatchesJoined {
  config: DiscordConfig;
}

export interface ServerMatch extends MatchesJoined {
  server: ServersRow;
}

export interface MatchResultsJoined extends Omit<MatchResultsRow, 'team'> {
  team: TeamsRow;
}

export interface MatchPlayerResultsJoined extends MatchPlayerResultsRow {
  player: PlayersRow;
}

export interface TeamsJoined extends Omit<TeamsRow, 'owner'> {
  owner: PlayersRow;
  players: Array<TeamPlayersRow>;
}
