import { getClient } from '../client';
import { del } from './generic';

export function list(key: string) {
  const push = async (...value: Array<string>): Promise<number> => {
    const client = await getClient();
    if (value.length === 0) {
      return 0;
    }
    return client.LPUSH(key, value);
  };
  const rpush = async (...value: Array<string>): Promise<number> => {
    const client = await getClient();
    if (value.length === 0) {
      return 0;
    }
    return client.RPUSH(key, value);
  };
  const pop = async (): Promise<string | null> => {
    const client = await getClient();
    return client.LPOP(key);
  };
  const rpop = async (): Promise<string | null> => {
    const client = await getClient();
    return client.RPOP(key);
  };
  const rpopBulk = async (count: number): Promise<Array<string> | null> => {
    const client = await getClient();
    return client.rPopCount(key, count);
  };
  const remove = async (value: string): Promise<number> => {
    const client = await getClient();
    return client.LREM(key, 0, value);
  };
  const range = async (): Promise<Array<string>> => {
    const client = await getClient();
    return client.LRANGE(key, 0, -1);
  };
  const has = async (value: string): Promise<boolean> => {
    const client = await getClient();
    const index = await client.LPOS(key, value);
    return index !== null;
  };
  const length = async (): Promise<number> => {
    const client = await getClient();
    return client.LLEN(key);
  };
  return {
    push,
    rpush,
    pop,
    rpop,
    rpopBulk,
    remove,
    range,
    has,
    length,
    del: () => del(key),
  };
}
