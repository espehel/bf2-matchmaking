import { isString } from '@bf2-matchmaking/types';

export function getArray(formData: FormData, key: string) {
  return Array.from(formData.entries())
    .filter(([k]) => k.includes(key))
    .map(([, v]) => v)
    .filter(isString);
}
