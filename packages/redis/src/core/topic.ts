import { createNewClient, getClient, handleClientConnection } from '../client';
import { unpack, pack } from 'msgpackr';

export function topic(channel: string) {
  const subscribeClient = createNewClient(`topic_${channel}_client`);

  const subscribe = async <T>(callback: (message: T) => void): Promise<void> => {
    const client = await handleClientConnection(subscribeClient);
    return client.SUBSCRIBE<true>(channel, (buffer) => callback(unpack(buffer)));
  };

  const unsubscribe = async (): Promise<void> => {
    const client = await handleClientConnection(subscribeClient);
    return client.UNSUBSCRIBE(channel);
  };

  const publish = async <T>(message: T): Promise<number> => {
    const client = await getClient();
    return client.PUBLISH(channel, pack(message));
  };
  return {
    publish,
    subscribe,
    unsubscribe,
  };
}
