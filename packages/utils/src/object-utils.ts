export const getKey = (
  object: Record<string, string>,
  value: string
): string | undefined => Object.keys(object).at(Object.values(object).indexOf(value));
