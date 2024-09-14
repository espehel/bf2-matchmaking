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

export function json<T = unknown>(key: string) {
  const get = async () => {
    const client = await getClient();
    return client.json.GET(key, { path: '$' }) as Promise<T | null>;
  };
  const getProperty = async <K extends keyof T & string>(
    property: K
  ): Promise<T[K] | null> => {
    const client = await getClient();
    return client.json.GET(key, { path: `$.${property}` }) as Promise<T[K] | null>;
  };

  const set = async (data: T) => {
    const client = await getClient();
    return client.json.SET(key, '$', jsonSchema.parse(data));
  };

  return {
    get,
    getProperty,
    set,
    exists: () => exists(key),
    del: () => del(key),
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
