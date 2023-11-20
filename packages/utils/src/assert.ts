export function assertObj(object: unknown, message?: string): asserts object {
  if (typeof object === 'undefined' || object === null) {
    throw new Error(message ? `Verify failed: ${message}` : 'Verify failed');
  }
}

export function assertString(
  object: unknown,
  message?: string
): asserts object is string {
  if (typeof object !== 'string') {
    throw new Error(message || `${typeof object} is not a string`);
  }
}
export function assertNumber(
  object: unknown,
  message?: string
): asserts object is number {
  if (typeof object !== 'number') {
    throw new Error(message || `${typeof object} is not a number`);
  }
}

export function assertArray(
  object: unknown,
  message?: string
): asserts object is Array<unknown> {
  if (!Array.isArray(object)) {
    throw new Error(message ? `Verify failed: ${message}` : 'Verify failed');
  }
}
