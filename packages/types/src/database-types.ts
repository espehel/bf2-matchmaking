import { Database } from './database-types.generated';
import { TeamPlayer } from './index';
import { exec } from 'node:child_process';

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
export type PlayerRatingsRow = Database['public']['Tables']['player_ratings']['Row'];
export type MatchServersRow = Database['public']['Tables']['match_servers']['Row'];
export type EventsRow = Database['public']['Tables']['events']['Row'];
export type EventRoundsRow = Database['public']['Tables']['event_rounds']['Row'];
export type EventMatchesRow = Database['public']['Tables']['event_matches']['Row'];

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
export type PlayerRatingsInsert =
  Database['public']['Tables']['player_ratings']['Insert'];
export type MatchServersInsert = Database['public']['Tables']['match_servers']['Insert'];

export type MatchesUpdate = Database['public']['Tables']['matches']['Update'];
export type PlayersUpdate = Database['public']['Tables']['players']['Update'];
export type ServersUpdate = Database['public']['Tables']['servers']['Update'];
export type ServerRconsUpdate = Database['public']['Tables']['server_rcons']['Update'];
export type TeamsUpdate = Database['public']['Tables']['teams']['Update'];
export type TeamPlayersUpdate = Database['public']['Tables']['team_players']['Update'];
export type MatchServersUpdate = Database['public']['Tables']['match_servers']['Update'];
export type EventMatchesUpdate = Database['public']['Tables']['event_matches']['Update'];

export enum MatchStatus {
  Open = 'Open',
  Scheduled = 'Scheduled',
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
  Team = 'team',
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
export interface MatchTeamPlayer extends TeamPlayersRow {
  player: PlayersRow;
}
export interface MatchTeam extends TeamsRow {
  players: Array<MatchTeamPlayer>;
}
export interface MatchesJoined
  extends Omit<MatchesRow, 'config' | 'server' | 'status' | 'home_team' | 'away_team'> {
  maps: Array<MapsRow>;
  players: Array<PlayersRow>;
  teams: Array<MatchPlayersRow>;
  status: MatchStatus;
  config: MatchConfigsRow;
  rounds: Array<RoundsJoined>;
  home_team: MatchTeam;
  away_team: MatchTeam;
}
export interface RoundsJoined
  extends Omit<RoundsRow, 'map' | 'server' | 'team1' | 'team2'> {
  map: MapsRow;
  server: ServersRow | null;
  team1: TeamsRow;
  team2: TeamsRow;
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

export interface ScheduledMatch extends MatchesJoined {
  status: MatchStatus.Scheduled;
  scheduled_at: string;
}

export interface MatchResultsJoined extends Omit<MatchResultsRow, 'team'> {
  team: TeamsRow;
}

export interface MatchPlayerResultsJoined extends MatchPlayerResultsRow {
  player: PlayersRow;
}

export interface PlayerResultsJoined extends Omit<MatchPlayerResultsRow, 'info'> {
  info: PlayerResultInfo;
  match: {
    home_team: TeamsRow;
    away_team: TeamsRow;
    config: MatchConfigsRow;
    players: Array<MatchPlayersRow>;
    results: Array<MatchResultsRow>;
  };
}

export interface TeamsJoined extends Omit<TeamsRow, 'owner'> {
  owner: PlayersRow;
  players: Array<PlayersRow>;
  captains: Array<TeamPlayersRow>;
}

export interface MatchResultInfo {
  homeTeam: string;
  homeTeamRating: number;
  homeTeamTickets: number;
  awayTeam: string;
  awayTeamRating: number;
  awayTeamTickets: number;
  type: string;
  name: string;
}
export interface PlayerResultInfo extends MatchResultInfo {
  score: number;
  rating: number;
  playerTeam: string;
}

export interface PlayerRatingsJoined extends Omit<PlayerRatingsRow, 'config'> {
  config: { id: number; name: string };
}
export interface MatchConfigResults extends MatchConfigsRow {
  matches: Array<{
    id: number;
    scheduled_at: string;
    status: MatchStatus;
    home_team: TeamsRow;
    away_team: TeamsRow;
    results: Array<MatchResultsRow>;
  }>;
}

export interface MatchServer
  extends Omit<MatchServersRow, 'active_server' | 'ip' | 'region' | 'instance'> {
  active: ServersRow | null;
}

export interface EventsMatch {
  id: number;
  home_team: TeamsRow;
  away_team: TeamsRow;
}
export interface EventsJoined extends EventsRow {
  teams: Array<TeamsRow>;
  rounds: Array<EventRoundsRow & { matches: Array<EventMatchesRow> }>;
  matches: Array<EventsMatch>;
}
