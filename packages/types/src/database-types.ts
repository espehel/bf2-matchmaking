import { Database } from './database-types.generated';

export type PlayersRow = Database['public']['Tables']['players']['Row'];
export type MapsRow = Database['public']['Tables']['maps']['Row'];
export type MatchesRow = Database['public']['Tables']['matches']['Row'];
export type MatchPlayersRow = Database['public']['Tables']['match_players']['Row'];
export type RoundsRow = Database['public']['Tables']['rounds']['Row'];
export type ServersRow = Database['public']['Tables']['servers']['Row'];
export type DiscordChannelsRow = Database['public']['Tables']['discord_channels']['Row'];
export type MatchConfigsRow = Database['public']['Tables']['match_configs']['Row'];
export type AdminRolesRow = Database['public']['Tables']['admin_roles']['Row'];

export type PlayersInsert = Database['public']['Tables']['players']['Insert'];
export type RoundsInsert = Database['public']['Tables']['rounds']['Insert'];
export type MatchesInsert = Database['public']['Tables']['matches']['Insert'];

export type MatchesUpdate = Database['public']['Tables']['matches']['Update'];

export enum MatchStatus {
  Open = 'Open',
  Summoning = 'Summoning',
  Drafting = 'Drafting',
  Ongoing = 'Ongoing',
  Closed = 'Closed',
  Deleted = 'Deleted',
}
export interface MatchesJoined extends Omit<MatchesRow, 'channel' | 'server' | 'status'> {
  maps: Array<MapsRow>;
  players: Array<PlayersRow>;
  channel: DiscordChannelsRow | null;
  teams: Array<MatchPlayersRow>;
  server: ServersRow | null;
  status: MatchStatus;
}
export interface RoundsJoined extends Omit<RoundsRow, 'map' | 'server'> {
  map: MapsRow;
  server: ServersRow;
}

export interface ServersJoined extends ServersRow {
  matches: Array<{ id: number; status: string }>;
}

export interface DiscordChannelsJoined extends Omit<DiscordChannelsRow, 'match_config'> {
  match_config: MatchConfigsRow | null;
}

export interface DiscordChannelsWithMatches extends DiscordChannelsRow {
  matches: Array<{ id: number; status: string }>;
}

export interface MatchConfigsJoined extends Omit<MatchConfigsRow, 'channel'> {
  channel: DiscordChannelsRow;
}

export type QuickMatch = [MatchConfigsJoined, MatchesJoined | null];

export interface DiscordMatch extends MatchesJoined {
  channel: DiscordChannelsRow;
}
