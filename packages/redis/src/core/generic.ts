import { getClient } from '../client';

export async function del(keys: Array<string> | string) {
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

export async function resetDb() {
  const client = await getClient();
  return client.flushAll();
}
