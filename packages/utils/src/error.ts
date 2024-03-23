import { FetchError } from '@bf2-matchmaking/types';

export function parseError(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  } else if (typeof e === 'string') {
    return e;
  } else {
    return JSON.stringify(e);
  }
}

export function toFetchError(e: unknown): FetchError {
  return { message: parseError(e) };
}
