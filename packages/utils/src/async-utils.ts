export async function retry<T>(fn: () => Promise<T>, retries: number = 5): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (retries === 0) {
      throw e;
    }
    await wait(1);
    return retry(fn, retries - 1);
  }
}

export function wait(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
