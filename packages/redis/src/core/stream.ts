import { getClient } from '../client';
import { pack, unpack } from 'msgpackr';
import { StreamEventReply, StreamMessageReply } from '@bf2-matchmaking/types/redis';

export function stream(key: string) {
  const add = async (record: Record<string, string>) => {
    const client = await getClient();
    return client.XADD(key, '*', record);
  };

  const addEvent = async (event: string, value: unknown) => {
    const client = await getClient();
    return client.XADD(key, '*', {
      event,
      payload: pack(value).toString('base64'),
      timestamp: Date.now().toString(),
    });
  };

  const readEvents = async (reverse = false): Promise<Array<StreamEventReply>> => {
    const client = await getClient();
    const results = reverse
      ? await client.XREVRANGE(key, '+', '-')
      : await client.XRANGE(key, '-', '+');
    return results.map(toStreamEventReply);
  };

  const readEventsBlocking = async (start: string) => {
    const client = await getClient();
    const stream = await client.XREAD({ key, id: start }, { BLOCK: 0, COUNT: 10 });
    return stream ? stream[0].messages.map(toStreamEventReply) : [];
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
    readEventsBlocking,
    log,
    readAll,
    del,
  };
}

function toStreamEventReply({
  id,
  message,
}: {
  id: string;
  message: Record<string, string>;
}): StreamEventReply {
  return {
    id,
    message: {
      event: message.event as string,
      payload: unpack(Buffer.from(message.payload, 'base64')),
      timestamp: message.timestamp as string,
    },
  };
}
