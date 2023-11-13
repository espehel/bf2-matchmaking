'use client';
import { DateTime } from 'luxon';

interface Props {
  date: string;
  format: string;
}

export default function Time({ date, format }: Props) {
  return <>{DateTime.fromISO(date).toFormat(format)}</>;
}
