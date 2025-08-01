import { createClient } from 'redis';

export function createNewClient(name: string) {
  return createClient({ url: process.env.REDIS_URL, name: name || 'default_client' })
    .on('connect', () => console.log('Redis Client Connected'))
    .on('ready', () => console.log('Redis Client Ready'))
    .on('reconnecting', () => console.log('Redis Client Reconnecting'))
    .on('error', (err) => console.log('Redis Client Error', err));
}

let defaultClient: ReturnType<typeof createClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithRedisClient = global as typeof globalThis & {
    _redisClient?: ReturnType<typeof createClient>;
  };

  if (!globalWithRedisClient._redisClient) {
    globalWithRedisClient._redisClient = createNewClient('default_client');
  }
  defaultClient = globalWithRedisClient._redisClient;
} else {
  // In production mode, it's best to not use a global variable.
  defaultClient = createNewClient('default_client');
}

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
