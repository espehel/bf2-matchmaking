export const getKey = (
  object: Record<string, string>,
  value: string | null | undefined
): string | undefined =>
  value ? Object.keys(object).at(Object.values(object).indexOf(value)) : undefined;
