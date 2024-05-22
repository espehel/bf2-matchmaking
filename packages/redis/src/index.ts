import { createClient } from 'redis';
import {
  LiveState,
  LiveServerStatus,
  PendingServer,
  ServerRconsRow,
} from '@bf2-matchmaking/types';
import {
  stringArraySchema,
  pendingServerSchema,
  rconSchema,
  serverInfoSchema,
  serverLiveSchema,
  serverSchema,
} from './schemas';
import { z } from 'zod';
import { Rcon, Server, ServerInfo, ServerLive } from './types';

let client: ReturnType<typeof createClient> | null = null;

async function getClient() {
  if (client && client.isReady) {
    return client;
  }
  if (client && !client.isReady) {
    return client.connect();
  }

  client = await createClient({ url: process.env.REDIS_URL })
    .on('connect', () => console.log('Redis Client Connected'))
    .on('ready', () => console.log('Redis Client Ready'))
    .on('reconnecting', () => console.log('Redis Client Reconnecting'))
    .on('error', (err) => console.log('Redis Client Error', err))
    .connect();
  return client;
}

export async function resetDb() {
  const client = await getClient();
  await client.flushDb();
}

export async function setValue(key: string, value: unknown) {
  const client = await getClient();
  await client.SET(key, stringifyValue(value));
}

export async function getValue<T>(key: string) {
  const client = await getClient();
  const value = await client.GET(key);
  try {
    return value !== null ? (JSON.parse(value) as T) : null;
  } catch (e) {
    return value as T;
  }
}

export async function deleteKeys(...keys: Array<string>) {
  const client = await getClient();
  return client.DEL(...keys);
}

export async function setServerLive(address: string, value: ServerLive) {
  return setValue(`server:${address}:live`, serverLiveSchema.parse(value));
}
export async function getServerLive(address: string): Promise<ServerLive> {
  return getValue(`server:${address}:live`).then(serverLiveSchema.parse);
}

export async function setServerValues(address: string, values: Server) {
  const client = await getClient();
  return Promise.all(
    Object.entries(serverSchema.parse(values)).map(([key, value]) =>
      client.HSET(`server:${address}`, key, value)
    )
  );
}
export async function getServerValues(address: string): Promise<Server> {
  const client = await getClient();
  return client.HGETALL(`server:${address}`).then(serverSchema.parse);
}

export async function setRcon(rcon: Rcon) {
  return setValue(`rcon:${rcon.address}`, rconSchema.parse(rcon));
}
export async function getRcon(address: string) {
  return getValue<ServerRconsRow>(`rcon:${address}`).then(rconSchema.parse);
}
export async function setServerInfo(address: string, info: ServerInfo) {
  return setValue(`server:${address}:info`, serverInfoSchema.parse(info));
}
export async function getServerInfo(address: string): Promise<ServerInfo> {
  return getValue<ServerRconsRow>(`server:${address}:info`).then(serverInfoSchema.parse);
}
export async function getServersWithStatus(key: LiveServerStatus) {
  const client = await getClient();
  const addressList = await client.sMembers(key);
  return stringArraySchema.parse(addressList);
}
export async function addServerWithStatus(address: string, key: LiveServerStatus) {
  const client = await getClient();
  return client.sAdd(key, address);
}
export async function removeServerWithStatus(address: string, key: LiveServerStatus) {
  const client = await getClient();
  return client.sRem(key, address);
}
export async function setMatch(match: any) {
  const client = await getClient();
  return {} as any;
}
export async function getMatch() {
  const client = await getClient();
  return {} as any;
}
export async function getMatchInfo() {
  const client = await getClient();
  return {} as any;
}
export async function setMatchInfo(matchId: string, values: any) {
  const client = await getClient();
  return {} as any;
}

export async function getMatchRounds(matchId: string) {
  const client = await getClient();
  return {} as any;
}

export async function setMatchRounds(matchId: string, rounds: any) {
  const client = await getClient();
  return {} as any;
}

export async function updateMatchPlayers(
  matchId: string,
  players: Array<string>
): Promise<Array<string>> {
  const client = await getClient();
  await client.SADD(`match${matchId}:players}`, players);
  return client.SMEMBERS(`match${matchId}:players}`).then(stringArraySchema.parse);
}

export async function getMatchPlayers(matchId: string): Promise<Map<string, any>> {
  const client = await getClient();
  return client.HGETALL(`match${matchId}:players}`);
}

export async function setMatchPlayer(
  matchId: string,
  playerHash: string,
  mp: any
): Promise<Map<string, any>> {
  const client = await getClient();
  return client.HMSET(`match${matchId}:players}`, playerHash, mp);
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}
