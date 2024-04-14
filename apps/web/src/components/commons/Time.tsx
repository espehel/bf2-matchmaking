'use client';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

interface Props {
  date: string;
  format: string;
  serverValue?: string;
}

export default function Time({ date, format, serverValue }: Props) {
  const [text, setText] = useState(serverValue || date);

  useEffect(() => {
    setText(() => DateTime.fromISO(date).toFormat(format));
  }, [date, format]);

  return <>{text}</>;
}
