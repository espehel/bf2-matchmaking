import { error } from '@bf2-matchmaking/logging';
import { getClient } from './index';
import { RedisResult } from './types';
import { parseError } from '@bf2-matchmaking/utils';

export function hash<T extends Record<string, number | string | boolean>>(key: string) {
  const getAll = async (): Promise<RedisResult<Partial<T>>> => {
    try {
      const client = await getClient();
      const data = await client.HGETALL(key);
      return { data, success: true };
    } catch (e) {
      error(`getHash ${key}`, e);
      return { error: parseError(e), success: false };
    }
  };

  const get = async (field: string): Promise<RedisResult<T[keyof T] | null>> => {
    try {
      const client = await getClient();
      const data = await client.HGET(key, field);
      return { data, success: true };
    } catch (e) {
      error(`getHash ${key}, field: ${field}`, e);
      return { error: parseError(e), success: false };
    }
  };

  const set = async (values: Partial<Record<keyof T, T[keyof T] | null>>) => {
    try {
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
        addedFields = await client.HSET(key, setValues);
      }
      return { data: { removedFields, addedFields }, error: null };
    } catch (e) {
      error(`setHash ${key}, value: ${JSON.stringify(values)}`, e);
      return { error: parseError(e), success: false };
    }
  };
  const del = async (): Promise<RedisResult<number>> => {
    try {
      const client = await getClient();
      const rowsDeleted = await client.DEL(key);
      return { data: rowsDeleted, success: true };
    } catch (e) {
      error(`del ${key}`, e);
      return { error: parseError(e), success: false };
    }
  };
  const inc = async (field: string | number, inc = 1): Promise<RedisResult<number>> => {
    try {
      const client = await getClient();
      const newValue = await client.HINCRBY(key, field, inc);
      return { data: newValue, success: true };
    } catch (e) {
      error(`inc ${key}`, e);
      return { error: parseError(e), success: false };
    }
  };
  return {
    getAll,
    get,
    set,
    del,
    inc,
  };
}
