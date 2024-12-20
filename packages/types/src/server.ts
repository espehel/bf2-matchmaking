import { LiveInfo } from './api-types';

export enum ServerStatus {
  LACKING = 'lacking',
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
  demos_path: string | null;
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
  data: null;
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
