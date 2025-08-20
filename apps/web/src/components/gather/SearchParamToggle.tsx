'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface CheckboxWithSearchParamProps {
  param: string;
  label: string;
}

export default function SearchParamToggle({
  param,
  label,
}: CheckboxWithSearchParamProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const isChecked = searchParams.has(param);

  const toggleParam = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (params.has(param)) {
      params.delete(param);
    } else {
      params.set(param, 'true'); // or could be empty string
    }

    const newUrl = `${pathname}?${params.toString()}`;
    router.push(newUrl, { scroll: false });
  }, [param, searchParams, pathname, router]);

  return (
    <label className="label">
      <input
        key={isChecked.toString()}
        type="checkbox"
        defaultChecked={isChecked}
        onChange={toggleParam}
        className="toggle"
      />
      {label}
    </label>
  );
}
