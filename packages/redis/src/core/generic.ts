import { getClient } from '../client';
import { RedisFlushModes } from 'redis';

export async function del(keys: Array<string> | string) {
  if (Array.isArray(keys) && keys.length === 0) {
    return 0;
  }
  const client = await getClient();
  return client.DEL(keys);
}

export async function exists(key: string): Promise<boolean> {
  const client = await getClient();
  const res = await client.EXISTS(key);
  return res !== 0;
}

export async function hello() {
  const client = await getClient();
  return client.HELLO();
}

export async function getConnections() {
  const client = await getClient();
  return client.CLIENT_LIST();
}

export async function flush() {
  const client = await getClient();
  return client.flushDb(RedisFlushModes.ASYNC);
}

export async function save() {
  const client = await getClient();
  return client.save();
}

type ArrayFilterPredicate<T> = (value: T, index: number, array: T[]) => boolean;
export async function matchKeys(pattern: string, filter?: ArrayFilterPredicate<string>) {
  const client = await getClient();
  const res = [];
  for await (const value of client.scanIterator({ MATCH: pattern })) {
    res.push(value);
  }
  if (filter) {
    return res.filter(filter);
  }
  return res;
}
