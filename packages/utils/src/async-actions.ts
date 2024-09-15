import { AsyncErrorResponse, AsyncResult } from '@bf2-matchmaking/types';
import { parseError } from './error';
import { wait } from './async-utils';

export async function retryAction<T>(
  fn: () => Promise<AsyncResult<T>>,
  retries: number = 5
): Promise<AsyncResult<T>> {
  const result = await fn();
  if (result.error && retries > 0) {
    await wait(1);
    return retryAction(fn, retries - 1);
  }
  return result;
}

export function toAsyncError(e: unknown): AsyncErrorResponse {
  return { data: null, error: { message: parseError(e) } };
}
