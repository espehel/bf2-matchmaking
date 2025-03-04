import { createClient } from 'redis';

export function createNewClient(name: string) {
  return createClient({ url: process.env.REDIS_URL, name })
    .on('connect', () => console.log('Redis Client Connected'))
    .on('ready', () => console.log('Redis Client Ready'))
    .on('reconnecting', () => console.log('Redis Client Reconnecting'))
    .on('error', (err) => console.log('Redis Client Error', err));
}

const defaultClient = createNewClient('default_client');

export function getClient() {
  return handleClientConnection(defaultClient);
}

export async function handleClientConnection(client: ReturnType<typeof createClient>) {
  if (client && client.isReady) {
    return client;
  }

  if (client.isOpen) {
    const promise = new Promise<typeof client>((resolve, reject) => {
      client
        .on('ready', () => {
          resolve(client);
        })
        .on('error', (err) => {
          reject(err);
        });
    });
    return promise;
  }

  return client.connect();
}
