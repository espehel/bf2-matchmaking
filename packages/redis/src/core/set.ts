import { getClient } from '../client';

export function set(key: string) {
  const add = async (...value: Array<string>): Promise<number> => {
    const client = await getClient();
    return client.SADD(key, value);
  };
  const remove = async (...value: Array<string>): Promise<number> => {
    const client = await getClient();
    return client.SREM(key, value);
  };
  const del = async () => {
    const client = await getClient();
    return client.DEL(key);
  };
  const members = async (): Promise<Array<string>> => {
    const client = await getClient();
    return client.SMEMBERS(key);
  };
  return {
    add,
    remove,
    del,
    members,
  };
}

export function sets(keys: Array<string>) {
  const members = async (): Promise<Array<string>> => {
    const client = await getClient();
    const sets = await Promise.all<Array<string>>(
      keys.map((key) => client.SMEMBERS(key))
    );
    return sets.flat();
  };
  return {
    members,
  };
}
