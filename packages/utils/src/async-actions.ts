import { AsyncResult } from '@bf2-matchmaking/types';

export async function retry<T>(
  fn: () => Promise<AsyncResult<T>>,
  retries: number = 5
): Promise<AsyncResult<T>> {
  const result = await fn();
  if (result.error && retries > 0) {
    await wait(1);
    return retry(fn, retries - 1);
  }
  return result;
}

export function wait(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
