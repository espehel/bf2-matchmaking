import { Schema, z } from 'zod';
import { AsyncResult } from '@bf2-matchmaking/types';
import { error, warn } from '@bf2-matchmaking/logging';
import { matchSchema, rconSchema, serverInfoSchema, serverLiveSchema } from './schemas';

export function validate<T extends Schema>(
  schema: T,
  response: AsyncResult<unknown>
): z.infer<T> {
  if (response.error) {
    throw new Error(response.error.message);
  }
  try {
    return schema.parse(response.data);
  } catch (e) {
    error('validate', e);
    throw e;
  }
}

export function validateSafe<T extends Schema>(
  schema: T,
  response: AsyncResult<unknown>
): z.infer<T> | null {
  if (!response.data) {
    return null;
  }
  const parsed = schema.safeParse(response.data);
  if (!parsed.success) {
    warn('validateSafe', parsed.error.message);
    return null;
  }
  return parsed.data;
}

export function validateMatch(response: AsyncResult<unknown>) {
  return validate(matchSchema, response);
}

export async function validateServerInfo(response: AsyncResult<unknown>) {
  return validate(serverInfoSchema, response);
}

export async function validateServerInfoSafe(response: AsyncResult<unknown>) {
  return validateSafe(serverInfoSchema, response);
}
export async function validateRcon(response: AsyncResult<unknown>) {
  return validate(rconSchema, response);
}
export async function validateServerLiveSafe(response: AsyncResult<unknown>) {
  return validateSafe(serverLiveSchema, response);
}
