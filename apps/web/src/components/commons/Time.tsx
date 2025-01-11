'use client';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

interface Props {
  date: string | number;
  format: string;
  serverValue?: string;
}

export default function Time({ date, format, serverValue }: Props) {
  const [text, setText] = useState(serverValue || date);

  useEffect(() => {
    if (typeof date === 'number') {
      setText(() => DateTime.fromMillis(date).toFormat(format));
    } else {
      setText(() => DateTime.fromISO(date).toFormat(format));
    }
  }, [date, format]);

  return <>{text}</>;
}
