import { api, getText } from '@bf2-matchmaking/utils';
import { error, info, logMessage } from '@bf2-matchmaking/logging';
import { formatDemoFilename, getHrefs } from './utils';
import { DateTime } from 'luxon';

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
  const { data, error: err } = await api.bot().postDemos({ server, demos });
  if (data) {
    logMessage(`Server ${server}: Saved ${demos.length} demos`, { ...data });
  }
  if (err) {
    error('saveDemos', err);
  }

  return data;
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
