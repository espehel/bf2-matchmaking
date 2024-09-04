import { Schema, z } from 'zod';
import { error, warn } from '@bf2-matchmaking/logging';
import { matchSchema, rconSchema, serverInfoSchema, serverLiveSchema } from './schemas';
import { RedisResult } from './types';

export function validate<T extends Schema>(
  schema: T,
  response: RedisResult<unknown>
): z.infer<T> {
  if (response.error) {
    throw new Error(response.error);
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
  response: RedisResult<unknown>
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

export function validateMatch(response: RedisResult<unknown>) {
  return validate(matchSchema, response);
}

export async function validateServerInfo(response: RedisResult<unknown>) {
  return validate(serverInfoSchema, response);
}

export async function validateServerInfoSafe(response: RedisResult<unknown>) {
  return validateSafe(serverInfoSchema, response);
}
export async function validateRcon(response: RedisResult<unknown>) {
  return validate(rconSchema, response);
}
export async function validateServerLiveSafe(response: RedisResult<unknown>) {
  return validateSafe(serverLiveSchema, response);
}
