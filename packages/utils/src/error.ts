import { FetchError } from '@bf2-matchmaking/types';

export function toFetchError(e: unknown): FetchError {
  if (e instanceof Error) {
    return { message: e.message };
  } else if (typeof e === 'string') {
    return { message: e };
  } else {
    return { message: JSON.stringify(e) };
  }
}
