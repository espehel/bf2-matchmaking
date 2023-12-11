import { DateTime } from 'luxon';

export const formatSecToMin = (seconds: string) => {
  const mm = Math.floor(parseInt(seconds) / 60)
    .toString()
    .padStart(2, '0');
  const ss = Math.floor(parseInt(seconds) % 60)
    .toString()
    .padStart(2, '0');
  return `${mm}:${ss}`;
};

export function toLocalISO(date: string | undefined | null, zone: string) {
  return date ? DateTime.fromISO(date).setZone(zone).toISO() || undefined : undefined;
}

export function formatDemoFilename(name: string) {
  const dateString = name.replace(/auto_|\.bf2demo/g, '');
  return DateTime.fromFormat(dateString, 'yyyy_MM_dd_HH_mm_ss', { zone: 'utc' });
}
