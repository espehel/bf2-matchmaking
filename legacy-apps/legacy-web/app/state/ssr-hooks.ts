import { useEffect, useState } from 'react';

export const useFirstRenderDefault = <T>(defaultValue: T, valueFn: () => T) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(valueFn());
  }, []);

  return value;
};
