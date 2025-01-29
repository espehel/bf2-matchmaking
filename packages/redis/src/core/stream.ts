import { getClient } from '../client';
import { pack, unpack } from 'msgpackr';

interface StreamMessageReply {
  id: string;
  message: Record<string, string>;
}

interface StreamEventReply {
  id: string;
  message: {
    event: string;
    payload: unknown;
    timestamp: string;
  };
}

export function stream(key: string) {
  const add = async (record: Record<string, string>) => {
    const client = await getClient();
    return client.XADD(key, '*', record);
  };

  const addEvent = async (event: string, value: unknown) => {
    const client = await getClient();
    return client.XADD(key, '*', {
      event,
      payload: pack(value),
      timestamp: Date.now().toString(),
    });
  };

  const readEvents = async (reverse = false): Promise<Array<StreamEventReply>> => {
    const client = await getClient();
    const results = reverse
      ? await client.XREVRANGE(key, '+', '-')
      : await client.XRANGE(key, '-', '+');
    return results.map((result) => ({
      ...result,
      message: {
        event: result.message.event,
        payload: unpack(result.message.payload as unknown as Buffer),
        timestamp: result.message.timestamp,
      },
    }));
  };

  const log = async (message: string, level: 'info' | 'warn' | 'error') => {
    const client = await getClient();
    return client.XADD(key, '*', { message, timestamp: Date.now().toString(), level });
  };

  const readAll = async (reverse = false): Promise<Array<StreamMessageReply>> => {
    const client = await getClient();
    return reverse ? client.XREVRANGE(key, '+', '-') : client.XRANGE(key, '-', '+');
  };

  const del = async () => {
    const client = await getClient();
    return client.DEL(key);
  };
  return {
    add,
    addEvent,
    readEvents,
    log,
    readAll,
    del,
  };
}
