import {
  MatchesJoined,
  PlayerListItem,
  RoundsInsert,
  ServerInfo,
  ServerMatch,
} from '@bf2-matchmaking/types';
import { info, logSupabaseError } from '@bf2-matchmaking/logging';
import { client } from '@bf2-matchmaking/supabase';
import { getCachedValue, setCachedValue } from '@bf2-matchmaking/utils/src/cache';

const liveRoundMap = new Map<number, RoundsInsert>();

export function getLiveRound(match: MatchesJoined | number) {
  if (typeof match === 'number') {
    return liveRoundMap.get(match);
  }
  return liveRoundMap.get(match.id);
}

export function removeLiveRound(match: MatchesJoined) {
  liveRoundMap.delete(match.id);
}

export async function updateLiveRound(
  match: ServerMatch,
  si: ServerInfo,
  pl: Array<PlayerListItem>
) {
  const mapId = await getMapId(si);

  if (mapId === -1) {
    return null;
  }

  const newRound: RoundsInsert = {
    team1_name: si.team1_Name,
    team1_tickets: si.team1_tickets,
    team2_name: si.team2_Name,
    team2_tickets: si.team2_tickets,
    map: mapId,
    server: match.server.ip,
    match: match.id,
    si: JSON.stringify(si),
    pl: JSON.stringify(pl),
  };
  info('updateLiveRound', `Players: [${pl?.map((p) => p.getName).join(', ')}]`);
  liveRoundMap.set(match.id, newRound);
}

async function getMapId(si: ServerInfo) {
  const cachedMap = getCachedValue<number>(si.currentMapName);
  if (cachedMap) {
    return cachedMap;
  }

  const { data: map, error: mapError } = await client()
    .searchMap(si.currentMapName)
    .single();

  if (mapError) {
    logSupabaseError('Failed to create round, map search failed.', mapError);
    return -1;
  }

  setCachedValue(si.currentMapName, map.id);
  return map.id;
}
