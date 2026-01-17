'use server';

import { logErrorMessage } from '@bf2-matchmaking/logging';
import { LogContext } from '@bf2-matchmaking/types';

export async function logError(error: unknown, context?: LogContext) {
  if (typeof error === 'string') {
    logErrorMessage(`Something went wrong in the browser: ${error}`, error, context);
  } else {
    logErrorMessage('Something went wrong in the browser', error, context);
  }
}
