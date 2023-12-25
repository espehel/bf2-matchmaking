import { DateTime } from 'luxon';

export function getHrefs(text: string) {
  const regex = /href="([^"]*)"/g;
  const hrefs = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    hrefs.push(match[1]);
  }

  return hrefs;
}

export function formatDemoFilename(name: string) {
  const dateString = name.replace(/auto_|\.bf2demo/g, '');
  return DateTime.fromFormat(dateString, 'yyyy_MM_dd_HH_mm_ss', { zone: 'utc' });
}
