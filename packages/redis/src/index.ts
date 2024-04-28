import { createClient } from 'redis';
import {
  LiveInfo,
  LiveServerStatus,
  PendingServer,
  ServerRconsRow,
} from '@bf2-matchmaking/types';
import {
  addressListSchema,
  pendingServerSchema,
  rconSchema,
  serverInfoSchema,
  serverSchema,
} from './schemas';
import { z } from 'zod';
import { Rcon, Server } from './types';

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

export async function setServerInfo(address: string, value: LiveInfo) {
  return setValue(`server:${address}:info`, serverInfoSchema.parse(value));
}
export async function getServerInfo(address: string): Promise<LiveInfo> {
  return getValue(`server:${address}:info`).then(serverInfoSchema.parse);
}

export async function setServer(address: string, values: Server) {
  const client = await getClient();
  return Promise.all(
    Object.entries(serverSchema.parse(values)).map(([key, value]) =>
      client.HSET(`server:${address}`, key, value)
    )
  );
}
export async function getServer(address: string): Promise<Server> {
  const client = await getClient();
  return client.HGETALL(`server:${address}`).then(serverSchema.parse);
}

export async function setRcon(rcon: Rcon) {
  return setValue(`rcon:${rcon.address}`, rconSchema.parse(rcon));
}
export async function getRcon(address: string) {
  return getValue<ServerRconsRow>(`rcon:${address}`).then(rconSchema.parse);
}
export async function setPendingServer(pendingServer: PendingServer) {
  const client = await getClient();
  return Promise.all([
    ...Object.entries(pendingServerSchema.parse(pendingServer)).map(([key, value]) =>
      client.HSET(`pending:${pendingServer.address}`, key, value)
    ),
  ]);
}
export async function getPendingServer(address: string) {
  return getValue<ServerRconsRow>(`pending:${address}`).then(pendingServerSchema.parse);
}
export async function getServersWithStatus(key: LiveServerStatus) {
  const client = await getClient();
  return client.sMembers(key).then(addressListSchema.parse);
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
