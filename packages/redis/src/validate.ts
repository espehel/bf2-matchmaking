import { Schema, z } from 'zod';
import { AsyncResult } from '@bf2-matchmaking/types';
import { error } from '@bf2-matchmaking/logging';
import { matchSchema } from './schemas';

export function validate<T extends Schema>(
  schema: T,
  response: AsyncResult<unknown>
): z.infer<T> {
  try {
    return schema.parse(response.data);
  } catch (e) {
    error('validate', e);
    throw e;
  }
}

export function validateMatch(response: AsyncResult<unknown>) {
  return validate(matchSchema, response);
}
