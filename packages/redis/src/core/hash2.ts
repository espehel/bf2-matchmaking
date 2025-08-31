import { getClient } from '../client';
import { del } from './generic';
import { assertString } from '@bf2-matchmaking/utils/assert';
import { hasValue } from '@bf2-matchmaking/types';

export function hash<F extends string>(key: string) {
  const getAll = async () => {
    const client = await getClient();
    return client.HGETALL(key) as Promise<Record<F, string>>;
  };

  const getSafe = async (field: F): Promise<string | undefined> => {
    const client = await getClient();
    return client.HGET(key, field);
  };

  const get = async (field: F): Promise<string> => {
    const value = await getSafe(field);
    assertString(value, `${key}: no value found for field ${field}`);
    return value;
  };

  const setEntries = async (entries: Array<[F, string]>) => {
    const client = await getClient();
    return client.HSET(key, entries);
  };

  const set = async (values: Partial<Record<F, string | number | null>>) => {
    const client = await getClient();
    const entries = Object.entries(values);
    const delValues = entries.filter(([, value]) => value === null).map(([key]) => key);
    let removedFields = 0;
    if (delValues.length) {
      removedFields = await client.HDEL(key, delValues);
    }
    const setValues = entries.filter(hasValue);
    let addedFields = 0;
    if (setValues.length) {
      addedFields = await client.HSET(key, setValues);
    }
    return { removedFields, addedFields };
  };

  const delByValue = async (value: string) => {
    // TODO
  };

  return {
    getAll,
    get,
    getSafe,
    set,
    setEntries,
    del: () => del(key),
    delByValue,
  };
}
