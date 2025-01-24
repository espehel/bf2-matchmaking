import { getClient } from '../client';
import { unpack, pack } from 'msgpackr';

export function topic(channel: string) {
  const publish = async <T>(message: T): Promise<number> => {
    const client = await getClient();
    return client.PUBLISH(channel, pack(message));
  };
  const subscribe = async <T>(callback: (message: T) => void): Promise<void> => {
    const client = await getClient();
    return client.SUBSCRIBE<true>(channel, (buffer) => callback(unpack(buffer)));
  };
  const unsubscribe = async (): Promise<void> => {
    const client = await getClient();
    return client.UNSUBSCRIBE(channel);
  };
  return {
    publish,
    subscribe,
    unsubscribe,
  };
}
