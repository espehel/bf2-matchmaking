import { createClient } from 'redis';
import {
  LiveInfo,
  LiveServer,
  LiveServerStatus,
  ServerRconsRow,
} from '@bf2-matchmaking/types';

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

export async function setServerInfo(address: string, value: LiveInfo) {
  return setValue(`server:${address}:info`, value);
}
export async function getServerInfo(address: string) {
  return getValue<LiveInfo>(`server:${address}:info`);
}

export async function setServer(address: string, values: Record<string, string>) {
  const client = await getClient();
  return Promise.all(
    Object.entries(values).map(([key, value]) =>
      client.HSET(`server:${address}`, key, value)
    )
  );
}
export async function getServer(address: string): Promise<Record<string, string>> {
  const client = await getClient();
  return client.HGETALL(`server:${address}`);
}

export async function setRcon(rcon: ServerRconsRow) {
  return setValue(`rcon:${rcon.id}`, rcon);
}
export async function getRcon(address: string) {
  return getValue<ServerRconsRow>(`rcon:${address}`);
}
export async function getServersWithStatus(key: LiveServerStatus) {
  const client = await getClient();
  return client.sMembers(key);
}
export async function addServerWithStatus(address: string, key: LiveServerStatus) {
  const client = await getClient();
  return client.sAdd(key, address);
}
export async function removeServerWithStatus(key: LiveServerStatus) {
  const client = await getClient();
  return client.sRem(key);
}

function stringifyValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
}
