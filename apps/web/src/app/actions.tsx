'use server';

import { logErrorMessage } from '@bf2-matchmaking/logging';

export async function logError(error: unknown) {
  logErrorMessage('Something went wrong in the browser', error);
}
