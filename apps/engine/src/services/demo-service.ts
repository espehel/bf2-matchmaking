import { error, info, logMessage } from '@bf2-matchmaking/logging';
import { getDemoChannel } from '../discord/services/message-service';
import { getText } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';

async function saveDemosInDiscord(server: string, demos: Array<string>) {
  try {
    const channel = await getDemoChannel();

    const batchSize = 10;
    const demoBatches = [];
    for (let i = 0; i < demos.length; i += batchSize) {
      const batch = demos.slice(i, Math.min(demos.length, i + batchSize));
      demoBatches.push(batch);
    }

    const responses = await Promise.all(
      demoBatches.map((demoBatch) =>
        channel.send({
          content: server,
          files: demoBatch,
        })
      )
    );
    return {
      channel: channel.id,
      messages: responses.map((response) => response.id).join(', '),
    };
  } catch (e) {
    error('POST /demos', e);
    return { message: 'Failed to save demos in discord', demos: demos };
  }
}

export async function saveDemosAll(server: string, demoPath?: string) {
  const path = demoPath || `http://${server}/demos`;
  const demos = await fetchDemos(path);
  info('saveDemosAll', `Server ${server}: Found ${demos.length} demos at ${path}`);
  if (demos.length === 0) {
    return null;
  }
  return postDemos(server, demos);
}

export async function saveDemosSince(server: string, isoDate: string, demoPath?: string) {
  const path = demoPath || `http://${server}/demos`;
  const demos = await fetchDemos(path, isoDate);
  info('saveDemosSince', `Server ${server}: Found ${demos.length} demos at ${path}`);
  if (demos.length === 0) {
    return null;
  }
  return postDemos(server, demos);
}
async function postDemos(server: string, demos: Array<string>) {
  const data = await saveDemosInDiscord(server, demos);
  if (data) {
    logMessage(`Server ${server}: Saved ${demos.length} demos`, { ...data });
  }
  return data;
}
async function fetchDemos(location: string, fromDate?: string) {
  const { data } = await getText(location);

  info('fetchDemos', `Server ${location}: {"from": "${fromDate}", "data": "${data}"}`);

  return data
    ? getHrefs(data)
        .filter((t) => t.startsWith('auto_') && t.endsWith('.bf2demo'))
        .filter(isNewerThan(fromDate))
        .map((name) => `${location}/${name}`)
    : [];
}

function isNewerThan(fromIsoString?: string) {
  const fromDate = fromIsoString ? DateTime.fromISO(fromIsoString) : null;
  return (fileName: string) => {
    if (!fromDate) {
      return true;
    }
    return fromDate < formatDemoFilename(fileName);
  };
}

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
