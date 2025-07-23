import { isString, isTruthy } from '@bf2-matchmaking/types';
import { assertNumber, assertTruthyString } from './assert';

export function getArray(formData: FormData, key: string) {
  return Array.from(formData.entries())
    .filter(([k]) => k.includes(key))
    .map(([, v]) => v)
    .filter(isString);
}

export function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  assertTruthyString(value, `Missing form data: ${key}`);
  return value;
}

export function getOptionalValue(formData: FormData, key: string) {
  const value = formData.get(key);
  if (isString(value) && isTruthy(value)) {
    return value;
  }
  return null;
}

export function getOptionalValueAsNumber(formData: FormData, key: string) {
  const value = getOptionalValue(formData, key);
  if (value === null) {
    return null;
  }
  const numValue = Number(value);
  if (Number.isNaN(numValue)) {
    throw new Error(`Invalid number for key ${key}: ${value}`);
  }
  return numValue;
}

export function getValueAsNumber(formData: FormData, key: string): number {
  const value = getOptionalValueAsNumber(formData, key);
  assertNumber(value, `Missing form data: ${key}`);
  return value;
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
