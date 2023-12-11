import { api, getText } from '@bf2-matchmaking/utils';
import { getHrefs } from '@bf2-matchmaking/utils/src/string-utils';
import { logMessage } from '@bf2-matchmaking/logging';

export async function saveDemos(server: string) {
  const demos = await fetchDemos(server);
  if (demos.length === 0) {
    return null;
  }

  const { data } = await api.bot().postDemos({ server, demos });
  if (data) {
    logMessage(`Server ${server}: Saved ${demos.length} demos`, { ...data });
  }

  return data;
}
async function fetchDemos(server: string) {
  const demoPath = `http://${server}/demos`;
  const { data } = await getText(demoPath);

  const demoes = data
    ? getHrefs(data)
        .filter((t) => t.startsWith('auto_') && t.endsWith('.bf2demo'))
        .map((name) => `${demoPath}/${name}`)
    : [];

  return demoes;
}
