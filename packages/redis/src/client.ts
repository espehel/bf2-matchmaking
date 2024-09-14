import { createClient } from 'redis';

const client = createClient({ url: process.env.REDIS_URL })
  .on('connect', () => console.log('Redis Client Connected'))
  .on('ready', () => console.log('Redis Client Ready'))
  .on('reconnecting', () => console.log('Redis Client Reconnecting'))
  .on('error', (err) => console.log('Redis Client Error', err));

export async function getClient() {
  if (client && client.isReady) {
    return client;
  }
  return client.connect();
}
