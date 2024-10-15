export function getKey(
  object: Record<string, string>,
  value: string | null | undefined
): string | undefined {
  return value ? Object.keys(object).at(Object.values(object).indexOf(value)) : undefined;
}
