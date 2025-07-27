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

export function formatDiscordMessageContentDateText(
  timeString: string | null,
  format: string
) {
  if (!timeString) {
    return null;
  }

  //Thursday, June 12th / 2100 CEST
  const cleaned = timeString
    .replace(/\s+/g, ' ') // multiple spaces to single space
    .replace(/(\d+)(st|nd|rd|th)/, '$1') // "12th" → "12"
    .replace(/\s*[A-Z]{3,4}$/, ''); // remove trailing timezone like " CEST"
  const date = DateTime.fromFormat(cleaned, format, { zone: 'Europe/Paris' }).set({
    year: new Date().getFullYear(),
  });
  console.log(date);
  if (!date.isValid && date.invalidExplanation) {
    throw new Error(date.invalidExplanation);
  }

  return date.toISO();
}

export function getFormatTooltip() {
  return (
    'cccc: Full weekday name (Sunday)\t' +
    'LLLL: Full month name (July)\t' +
    'd: Day of month (1 – 31) without a leading zero (27)\t' +
    'HH: 24-hour clock, two-digit hour (21)\t' +
    'mm: Two-digit minute (00)'
  );
}
