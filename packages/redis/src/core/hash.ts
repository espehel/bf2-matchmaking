import { getClient } from '../client';
import { del } from './generic';

export function hash<T extends Record<string, number | string>>(key: string) {
  const getAll = async (): Promise<T> => {
    const client = await getClient();
    return client.HGETALL(key) as Promise<T>;
  };

  const get = async (field: string): Promise<T[keyof T] | undefined> => {
    const client = await getClient();
    return client.HGET(key, field) as Promise<T[keyof T] | undefined>;
  };

  const set = async (values: Partial<Record<keyof T, T[keyof T] | null>>) => {
    const client = await getClient();
    const entries = Object.entries(values);
    const delValues = entries
      .filter(([, value]) => value === null || value === undefined)
      .map(([key]) => key);
    let removedFields = 0;
    if (delValues.length) {
      removedFields = await client.HDEL(key, delValues);
    }
    const setValues = entries.filter(
      ([, value]) => value !== null && value !== undefined
    );
    let addedFields = 0;
    if (setValues.length) {
      addedFields = await client.HSET(key, setValues as Array<[string, number | string]>);
    }
    return { removedFields, addedFields };
  };

  const inc = async (field: string, inc = 1): Promise<number> => {
    const client = await getClient();
    return await client.HINCRBY(key, field, inc);
  };

  const values = async (): Promise<Array<string>> => {
    const client = await getClient();
    return await client.HVALS(key);
  };

  const keys = async (): Promise<Array<string>> => {
    const client = await getClient();
    return client.HKEYS(key);
  };

  const delEntry = async (entry: string | Array<string>): Promise<number> => {
    const client = await getClient();
    return await client.HDEL(key, entry);
  };

  return {
    getAll,
    get,
    set,
    del: () => del(key),
    delEntry,
    inc,
    values,
    keys,
  };
}