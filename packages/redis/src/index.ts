import { createClient } from 'redis';
import { LiveServerStatus, AsyncResult } from '@bf2-matchmaking/types';
import {
  stringArraySchema,
  rconSchema,
  serverInfoSchema,
  serverLiveSchema,
} from './schemas';
import { Rcon, ServerInfo, ServerLive } from './types';
import { error } from '@bf2-matchmaking/logging';
import { assertObj } from '@bf2-matchmaking/utils';
import { Schema, z } from 'zod';
import { toAsyncError } from '@bf2-matchmaking/utils/src/async-actions';

function toKey(key: string, id: string | number) {
  return `${key}${id ? `:${id}` : ''}`;
}

let client: ReturnType<typeof createClient> | null = null;

export async function getClient() {
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

export async function set(
  schema: Schema,
  key: string,
  value: unknown
): Promise<AsyncResult<string>> {
  try {
    const parsed = schema.parse(value);
    const client = await getClient();
    const res = await client.SET(key, stringifyValue(parsed));
    return { data: res, error: null };
  } catch (e) {
    error(`setValue ${key} ${JSON.stringify(value)}`, e);
    return toAsyncError(e);
  }
}

export async function get<T = unknown>(key: string): Promise<AsyncResult<T>> {
  const client = await getClient();
  const value = await client.GET(key);
  try {
    assertObj(value, `${key} not found`);
    const data = JSON.parse(value);
    return { data, error: null };
  } catch (e) {
    error(`getValue ${key}`, e);
    return toAsyncError(e);
  }
}

export async function getHash<T extends Record<string, number | string | boolean>>(
  key: string,
  id: string | number
): Promise<AsyncResult<Partial<T>>> {
  try {
    const client = await getClient();
    const data = await client.HGETALL(toKey(key, id));
    return { data, error: null };
  } catch (e) {
    error(`getHash ${toKey(key, id)}`, e);
    return toAsyncError(e);
  }
}

export async function setHash<T extends Record<string, number | string | boolean | null>>(
  key: string,
  id: string | number,
  values: Partial<T>
) {
  try {
    const client = await getClient();
    const entries = Object.entries(values);
    const delValues = entries
      .filter(([, value]) => value === null || value === undefined)
      .map(([key]) => key);
    let removedFields = 0;
    if (delValues.length) {
      removedFields = await client.HDEL(toKey(key, id), delValues);
    }
    const setValues = entries.filter(
      ([, value]) => value !== null && value !== undefined
    );
    let addedFields = 0;
    if (setValues.length) {
      addedFields = await client.HSET(toKey(key, id), setValues);
    }
    return { data: { removedFields, addedFields }, error: null };
  } catch (e) {
    error(`setHash ${toKey(key, id)}, value: ${JSON.stringify(values)}`, e);
    return toAsyncError(e);
  }
}

export async function deleteKeys(...keys: Array<string>) {
  const client = await getClient();
  return client.DEL(...keys);
}

export async function setServerLive(address: string, value: ServerLive) {
  return set(serverLiveSchema, `server:${address}:live`, value);
}

export async function setRcon(rcon: Rcon) {
  return set(rconSchema, `rcon:${rcon.address}`, rcon);
}
export async function setServerInfo(address: string, info: ServerInfo) {
  return set(serverInfoSchema, `server:${address}:info`, info);
}

export async function setCachedMatchesJoined(match: { id: number }) {
  return set(z.unknown(), `match:${match.id}:cache`, match);
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

export async function addActiveMatchServer(address: string, matchId: string) {
  const client = await getClient();
  return client.HSET('active', matchId, address);
}
export async function getActiveMatchServer(matchId: string): Promise<string | null> {
  const client = await getClient();
  return client.HGET('active', matchId);
}
export async function getActiveMatchServers(): Promise<Record<string, string>> {
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
export async function addMatch(matchId: string) {
  const client = await getClient();
  return client.SADD('matches', matchId);
}
export async function getMatches() {
  const client = await getClient();
  const matchIdList = await client.SMEMBERS('matches');
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
