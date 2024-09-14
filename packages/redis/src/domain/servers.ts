import { LiveServerStatus, LiveInfo } from '@bf2-matchmaking/types';
import { hash } from '../core/hash';
import { set } from '../core/set';
import { assertString } from '@bf2-matchmaking/utils';
import { json } from '../core/json';
import { Server, ServerInfo } from '../types';
import { serverInfoSchema } from '../schemas';

export function getServersWithStatus(status: LiveServerStatus) {
  if (status === 'active') {
    return hash(`servers:active`).values();
  }
  return set(`servers:${status}`).members();
}

export async function addActiveMatchServer(address: string, matchId: string) {
  return hash('servers:active').set({ [matchId]: address });
}
export async function getActiveMatchServer(matchId: string): Promise<string | undefined> {
  return hash<Record<string, string>>('servers:active').get(matchId);
}
export async function getActiveMatchServers(): Promise<Record<string, string>> {
  return hash<Record<string, string>>('servers:active').getAll();
}

export async function addServerWithStatus(
  address: string,
  key: LiveServerStatus,
  matchId?: string
) {
  if (key !== 'active') {
    await set(`servers:${key}`).add(address);
  }
  assertString(matchId, 'matchId must be defined when key is active');
  return addActiveMatchServer(address, matchId);
}
export async function removeServerWithStatus(address: string, key: LiveServerStatus) {
  if (key === 'active') {
    return hash('server:active').delEntry(address);
  }
  return set(`servers:${key}`).remove(address);
}

export async function setServerLiveInfo(address: string, info: LiveInfo) {
  return json(`servers:info:${address}`).set(info);
}
export async function getServerLiveInfo(address: string) {
  return json<LiveInfo>(`servers:info:${address}`).get();
}

export async function setServer(address: string, info: ServerInfo) {
  return json(`servers:${address}`).set(info);
}
export async function getServer(address: string) {
  return json(`servers:${address}`).get().then(serverInfoSchema.parse);
}

export async function setServerLive(address: string, server: Server) {
  return hash(`servers:live:${address}`).set(server);
}
export async function getServerLive(address: string) {
  return hash<Server>(`servers:live:${address}`).getAll();
}
