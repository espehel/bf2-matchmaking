import { LiveInfo } from './api-types';

export enum ServerStatus {
  ACTIVE = 'active',
  OFFLINE = 'offline',
  IDLE = 'idle',
  RESTARTING = 'restarting',
}

export interface ServerData {
  port: string;
  name: string;
  joinmeHref: string;
  joinmeDirect: string;
  country: string;
  city: string;
  noVehicles: boolean;
  demos_path: string;
}

export interface LiveServer {
  address: string;
  name: string;
  status: ServerStatus;
  matchId?: number;
  liveAt?: string;
  updatedAt?: string;
  errorAt?: string;
  live: LiveInfo | null;
  data: ServerData | null;
}

export interface ConnectedLiveServer extends LiveServer {
  status: ServerStatus.ACTIVE | ServerStatus.IDLE;
  live: LiveInfo;
  data: ServerData;
}

export interface OfflineServer extends LiveServer {
  status: ServerStatus.RESTARTING | ServerStatus.OFFLINE;
  live: null;
}

export interface ServerLocation {
  query: string;
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

export interface ServerLogEntry {
  message: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
}

export type ServersLogs = Array<[string, Array<ServerLogEntry>]>;

export interface RestartBF2ServerData {
  profilexml: string;
  serverName: string;
  mapName: string;
}
