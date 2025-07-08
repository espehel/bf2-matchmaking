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

export function formatDiscordMessageContentDateText(text: string) {
  const timeMatch = text.match(/Date:\s*(.+)/);
  const time = timeMatch ? timeMatch[1].trim() : null;
  if (!time) {
    return null;
  }

  //Thursday, June 12th / 2100 CEST
  const cleaned = time
    .replace(/\s+/g, ' ') // multiple spaces to single space
    .replace(/(\d+)(st|nd|rd|th)/, '$1') // "12th" → "12"
    .replace(/\s*[A-Z]{3,4}$/, ''); // remove trailing timezone like " CEST"
  const format = 'cccc, LLLL d / HHmm';
  const date = DateTime.fromFormat(cleaned, format, { zone: 'Europe/Paris' }).set({
    year: new Date().getFullYear(),
  });

  if (!date.isValid && date.invalidExplanation) {
    throw new Error(date.invalidExplanation);
  }

  return date.toISO();
}
