import { info, logErrorMessage, logMessage } from '@bf2-matchmaking/logging';
import { getDemoChannel } from '../discord/services/message-service';
import { getText } from '@bf2-matchmaking/utils';
import { DateTime } from 'luxon';
import { StartedMatch } from '@bf2-matchmaking/types';
import { ServerData } from '@bf2-matchmaking/redis/types';
import { buildMatchDemoContent } from '@bf2-matchmaking/discord';

async function saveDemosInDiscord(
  server: string,
  demos: Array<string>,
  serverData: ServerData,
  match?: StartedMatch
) {
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
          content: match ? buildMatchDemoContent(server, match, serverData) : server,
          files: demoBatch,
        })
      )
    );
    const result = {
      channel: channel.id,
      messages: responses.map((response) => response.id).join(', '),
    };
    logMessage(`Server ${server}: Saved ${demos.length} demos`, { ...result });
    return result;
  } catch (e) {
    logErrorMessage(`Server ${server}: Failed to save demos in discord`, e, { demos });
    return null;
  }
}

export async function saveDemosAll(server: string, serverData: ServerData) {
  const demos = await fetchDemos(serverData.demos_path);
  info(
    'saveDemosAll',
    `Server ${server}: Found ${demos.length} demos at ${serverData.demos_path}`
  );
  if (demos.length === 0) {
    return null;
  }
  return saveDemosInDiscord(server, demos, serverData);
}

export async function saveMatchDemos(
  server: string,
  match: StartedMatch,
  serverData: ServerData
) {
  const demos = await fetchDemos(serverData.demos_path, match.started_at);
  info(
    'saveDemosSince',
    `Server ${server}: Found ${demos.length} demos at ${serverData.demos_path}`
  );
  if (demos.length === 0) {
    return null;
  }
  return saveDemosInDiscord(server, demos, serverData, match);
}

async function fetchDemos(location: string, fromDate?: string) {
  const { data } = await getText(location);
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
