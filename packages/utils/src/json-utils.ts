import { assertString, assertObj } from './assert';

export function parseJSON<T>(json: unknown): T {
  assertString(json, 'json object must be a string');
  const parsed = JSON.parse(json);
  assertObj(parsed, 'json object must be defined');
  return parsed;
}
