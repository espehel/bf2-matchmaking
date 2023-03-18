import { Database } from './database-types.generated';

export type PlayersRow = Database['public']['Tables']['players']['Row'];
export type MapsRow = Database['public']['Tables']['maps']['Row'];
export type MatchesRow = Database['public']['Tables']['matches']['Row'];
export type MatchPlayersRow = Database['public']['Tables']['match_players']['Row'];
export type RoundsRow = Database['public']['Tables']['rounds']['Row'];
export type ServersRow = Database['public']['Tables']['servers']['Row'];
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
export enum DraftType {
  Captain = 'captain',
  Random = 'random',
}

export enum MapDraftType {
  Random = 'random',
}

export interface MatchConfigsRow
  extends Omit<
    Database['public']['Tables']['match_configs']['Row'],
    'draft' | 'map_draft'
  > {
  draft: DraftType;
  map_draft: MapDraftType;
}
export interface MatchesJoined extends Omit<MatchesRow, 'config' | 'server' | 'status'> {
  maps: Array<MapsRow>;
  players: Array<PlayersRow>;
  teams: Array<MatchPlayersRow>;
  server: ServersRow | null;
  status: MatchStatus;
  config: MatchConfigsRow;
}
export interface RoundsJoined extends Omit<RoundsRow, 'map' | 'server'> {
  map: MapsRow;
  server: ServersRow;
}

export interface ServersJoined extends ServersRow {
  matches: Array<{ id: number; status: string }>;
}

export type QuickMatch = [MatchConfigsRow, MatchesJoined | null];

export interface DiscordConfig extends MatchConfigsRow {
  channel: string;
}

export interface DiscordMatch extends MatchesJoined {
  config: DiscordConfig;
}
