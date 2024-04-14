import { isString } from '@bf2-matchmaking/types';
import { assertString } from './assert';

export function getArray(formData: FormData, key: string) {
  return Array.from(formData.entries())
    .filter(([k]) => k.includes(key))
    .map(([, v]) => v)
    .filter(isString);
}

export function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  assertString(value, `Missing form data: ${key}`);
  return value;
}

export function getOptionalValue(formData: FormData, key: string) {
  const value = formData.get(key);
  if (isString(value)) {
    return value;
  }
  return null;
}

export function getValues<K extends string>(
  formData: FormData,
  ...keys: Array<K>
): Record<K, string> {
  return keys.reduce(
    (acc, key) => ({ ...acc, [key]: getValue(formData, key) }),
    {} as Record<K, string>
  );
}

export function getOptionalValues<K extends string>(
  formData: FormData,
  ...keys: Array<K>
): Record<K, string | null> {
  return keys.reduce(
    (acc, key) => ({ ...acc, [key]: getOptionalValue(formData, key) }),
    {} as Record<K, string>
  );
}
