import NodeCache from 'node-cache';

declare global {
  var __cache: NodeCache | undefined;
}

let cache: NodeCache;
if (process.env.NODE_ENV === 'production') {
  cache = new NodeCache({ stdTTL: 12000 });
} else {
  if (!global.__cache) {
    global.__cache = new NodeCache({ stdTTL: 12000 });
  }
  cache = global.__cache;
}

export const setCachedValue = (key: string, value: unknown) => cache.set(key, value);

export const getCachedValue = <T>(key: string) => cache.get<T>(key);
