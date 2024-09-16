import { getClient } from '../client';
import { del, exists } from './generic';
import { jsonSchema } from '../schemas';
import { z } from 'zod';
import { isDefined } from '@bf2-matchmaking/types';

interface JsonMSetItem {
  key: string;
  path: string;
  value: z.infer<typeof jsonSchema>;
}

function getFirstElement<T>(array: unknown): T | null {
  if (Array.isArray(array) && array.length > 0) {
    return array[0];
  }
  return null;
}

export function json<T = unknown>(key: string) {
  const get = async (): Promise<T | null> => {
    const client = await getClient();
    return client.json.GET(key, { path: '$' }).then(getFirstElement<T>);
  };
  const getProperty = async <K extends keyof T & string>(property: K) => {
    const client = await getClient();
    return client.json.GET(key, { path: `$.${property}` }).then(getFirstElement<T[K]>);
  };

  const set = async (data: T) => {
    const client = await getClient();
    return client.json.SET(key, '$', jsonSchema.parse(data));
  };

  const setProperty = async <K extends keyof T & string>(property: K, value: T[K]) => {
    const client = await getClient();
    return client.json.SET(key, `$.${property}`, jsonSchema.parse(value));
  };

  const delProperty = async <K extends keyof T & string>(property: K) => {
    const client = await getClient();
    return client.json.DEL(key, `$.${property}`);
  };

  return {
    get,
    getProperty,
    set,
    setProperty,
    exists: () => exists(key),
    del: () => del(key),
    delProperty,
  };
}

export async function setMultiple(objects: Array<[string, unknown]>): Promise<string> {
  const client = await getClient();
  const items: Array<JsonMSetItem> = objects.map(([key, value]) => ({
    key,
    path: '$',
    value: jsonSchema.parse(value),
  }));
  return client.json.MSET(items);
}

export async function getMultiple<T = unknown>(keys: Array<string>): Promise<Array<T>> {
  const client = await getClient();
  const result = await client.json.MGET(keys, '$');
  return result.flat().filter(isDefined) as Array<T>;
}
