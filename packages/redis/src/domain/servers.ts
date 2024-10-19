import { LiveInfo } from '@bf2-matchmaking/types';
import { hash } from '../core/hash';
import { set } from '../core/set';
import { assertString } from '@bf2-matchmaking/utils';
import { json } from '../core/json';
import { Server, ServerData } from '../types';
import { serverDataSchema } from '../schemas';
import { ServerStatus } from '@bf2-matchmaking/types/server';

export function getServersWithStatus(status: ServerStatus) {
  if (status === ServerStatus.ACTIVE) {
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
  key: ServerStatus,
  matchId?: string
) {
  if (key !== ServerStatus.ACTIVE) {
    return set(`servers:${key}`).add(address);
  }
  assertString(matchId, 'matchId must be defined when key is active');
  return addActiveMatchServer(address, matchId);
}
export async function removeServerWithStatus(address: string, key: ServerStatus) {
  if (key === ServerStatus.ACTIVE) {
    return hash('servers:active').delValue(address);
  }
  return set(`servers:${key}`).remove(address);
}

export async function setServerLiveInfo(address: string, info: LiveInfo) {
  return json(`servers:${address}:info`).set(info);
}
export async function getServerLiveInfo(address: string) {
  return json<LiveInfo>(`servers:${address}:info`).get();
}

export async function setServerData(address: string, data: ServerData) {
  return json(`servers:${address}:data`).set(data);
}
export async function getServerData(address: string) {
  return json(`servers:${address}:data`).get().then(serverDataSchema.parse);
}
export async function getServerDataSafe(address: string) {
  try {
    return await getServerData(address);
  } catch (e) {
    return null;
  }
}

export async function setServer(address: string, server: Partial<Server>) {
  return hash(`servers:${address}`).set(server);
}
export async function getServer(address: string) {
  return hash<Server>(`servers:${address}`).getAll();
}

export async function addServer(address: string, status: ServerStatus) {
  await hash(`servers:${address}`).set({ status });
  await addServerWithStatus(address, status);
}
