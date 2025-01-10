import { getClient } from '../client';

interface StreamMessageReply {
  id: string;
  message: Record<string, string>;
}

export function stream(key: string) {
  const add = async (record: Record<string, string>) => {
    const client = await getClient();
    return client.XADD(key, '*', record);
  };
  const addEvent = async (event: string, value: string) => {
    const client = await getClient();
    return client.XADD(key, '*', { [event]: value });
  };
  const log = async (message: string, level: 'info' | 'warn' | 'error') => {
    const client = await getClient();
    return client.XADD(key, '*', { message, timestamp: Date.now().toString(), level });
  };

  const readAll = async (): Promise<Array<StreamMessageReply>> => {
    const client = await getClient();
    return client.XRANGE(key, '-', '+');
  };

  const del = async () => {
    const client = await getClient();
    return client.DEL(key);
  };
  return {
    add,
    addEvent,
    log,
    readAll,
    del,
  };
}
