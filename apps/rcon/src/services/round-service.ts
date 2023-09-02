import { LiveRound, PlayerListItem, ServerInfo } from '@bf2-matchmaking/types';
import { logSupabaseError } from '@bf2-matchmaking/logging';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getCachedValue, setCachedValue } from '@bf2-matchmaking/utils/src/cache';
import { LiveMatch } from './LiveMatch';

export function createLiveRound(
  liveMatch: LiveMatch,
  si: ServerInfo,
  pl: Array<PlayerListItem>
): LiveRound {
  const mergedPl = pl
    .concat(liveMatch.liveRound?.pl || [])
    .filter(
      (p, i, self) => self.findIndex((otherP) => otherP.keyhash === p.keyhash) === i
    );

  return {
    team1_name: si.team1_Name,
    team1_tickets: si.team1_tickets,
    team2_name: si.team2_Name,
    team2_tickets: si.team2_tickets,
    map: si.currentMapName,
    server: liveMatch.match.server.ip,
    match: liveMatch.match.id,
    si,
    pl: mergedPl,
  };
}

export async function insertRound(liveRound: LiveRound) {
  const round = {
    ...liveRound,
    si: JSON.stringify(liveRound.si),
    pl: JSON.stringify(liveRound.pl),
    map: await getMapId(liveRound.si),
  };
  return client().createRound(round).then(verifySingleResult);
}

export async function getMapId(si: ServerInfo) {
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
