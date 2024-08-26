import { createClient } from 'redis';
import { LiveServerStatus, ServerRconsRow, MatchesJoined } from '@bf2-matchmaking/types';
import {
  stringArraySchema,
  rconSchema,
  serverInfoSchema,
  serverLiveSchema,
  serverSchema,
  matchSchema,
} from './schemas';
import { Match, Rcon, Server, ServerInfo, ServerLive } from './types';

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
  return client.HSET(`server:${address}`, ...Object.entries(values));
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

export async function setMatchValues(matchId: string | number, values: Partial<Match>) {
  const client = await getClient();
  return client.HSET(`match:${matchId}`, ...Object.entries(values));
}
export async function getMatchValues(matchId: string | number): Promise<Match> {
  const client = await getClient();
  return client.HGETALL(`match:${matchId}`).then(matchSchema.parse);
}
export async function getCachedMatchesJoined(
  matchId: string
): Promise<MatchesJoined | null> {
  return getValue<MatchesJoined>(`match:${matchId}:cache`);
}
export async function setCachedMatchesJoined(match: MatchesJoined) {
  return setValue(`match:${match.id}:cache`, match);
}

export async function incMatchRoundsPlayed(matchId: string | number): Promise<number> {
  const client = await getClient();
  return client.HINCRBY(`match:${matchId}`, 'roundsPlayed', 1);
}

export async function getMatchPlayers(matchId: string): Promise<Array<string>> {
  const client = await getClient();
  return client.SMEMBERS(`match:${matchId}:players}`).then(stringArraySchema.parse);
}

export async function setMatchPlayer(
  matchId: string,
  playerHash: string
): Promise<Map<string, any>> {
  const client = await getClient();
  return client.SADD(`match:${matchId}:players`, playerHash);
}

export async function removeMatch(matchId: string) {
  const client = await getClient();
  await client.DEL(
    `match:${matchId}`,
    `match:${matchId}:players`,
    `match:${matchId}:cached`
  );
  await client.SREM('matches', matchId);
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}

export async function addActiveServer(address: string, matchId: string) {
  const client = await getClient();
  return client.HSET('active', matchId, address);
}
export async function getActiveMatchServer(matchId: string): Promise<string | null> {
  const client = await getClient();
  return client.HGET('active', matchId);
}
export async function getActiveMatchServers(): Promise<Map<string, string>> {
  const client = await getClient();
  return client.HGETALL('active');
}
export async function getServersWithStatus(key: LiveServerStatus) {
  const client = await getClient();
  const addressList =
    key === 'active' ? await client.HVALS(key) : await client.SMEMBERS(key);
  return stringArraySchema.parse(addressList);
}
export async function addServerWithStatus(
  address: string,
  key: Exclude<LiveServerStatus, 'active'>
) {
  const client = await getClient();
  return client.SADD(key, address);
}
export async function removeServerWithStatus(address: string, key: LiveServerStatus) {
  const client = await getClient();
  if (key === 'active') {
    return client.HDEL(key, address);
  }
  return client.SREM(key, address);
}
export async function getActiveMatches() {
  const client = await getClient();
  const matchIdList = await client.HKEYS('active');
  return stringArraySchema.parse(matchIdList);
}
export async function hasActiveMatch(matchId: string) {
  const client = await getClient();
  const reply = await client.HEXISTS('active', matchId);
  return Boolean(reply);
}
export async function addMatch(matchId: string) {
  const client = await getClient();
  return client.SADD('matches', matchId);
}
export async function getMatches() {
  const client = await getClient();
  const matchIdList = await client.HKEYS('matches');
  return stringArraySchema.parse(matchIdList);
}

export async function setMaps(maps: Array<[string, string]>) {
  const client = await getClient();
  return client.HSET('maps', maps);
}

export async function getMapName(id: string): Promise<string> {
  const client = await getClient();
  return client.HGET('maps', id);
}
