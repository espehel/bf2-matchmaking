import { client } from '@bf2-matchmaking/supabase';
import { info, logErrorMessage } from '@bf2-matchmaking/logging';
import { getMapName, setMaps } from '@bf2-matchmaking/redis';

export async function loadMapsCache() {
  const { data: maps, error: e } = await client().getMaps();
  if (maps) {
    await setMaps(
      maps.map((map) => [map.id.toString(), map.name.toLowerCase().replace(/ /g, '_')])
    );
    info('loadMapsCache', 'Loaded maps');
    return maps;
  } else {
    logErrorMessage('Failed to load maps cache', e);
    return null;
  }
}

export function findMap(id: number) {
  return getMapName(id.toString());
}
