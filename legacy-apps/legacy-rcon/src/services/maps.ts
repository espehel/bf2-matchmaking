import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { getCachedValue, setCachedValue } from '@bf2-matchmaking/utils/src/cache';
import { error, info } from '@bf2-matchmaking/logging';
import { MapsRow } from '@bf2-matchmaking/types';

export function loadMapsCache() {
  client()
    .getMaps()
    .then(({ data: maps, error: err }) => {
      if (maps) {
        setCachedValue('maps', maps);
        info('loadMapsCache', 'Loaded maps');
      }
      if (err) {
        error('loadMapsCache', err);
      }
    });
}

export function findMap(id: number) {
  const maps = getCachedValue<Array<MapsRow>>('maps');
  return maps?.find((map) => map.id === id);
}
