import { MatchesJoined, LiveInfo, RoundsInsert, Json } from '@bf2-matchmaking/types';
import { logSupabaseError } from '@bf2-matchmaking/logging';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getCachedValue, setCachedValue } from '@bf2-matchmaking/utils/src/cache';
import { getTeamTuple } from '@bf2-matchmaking/utils/src/round-utils';

export async function insertRound(match: MatchesJoined, liveInfo: LiveInfo) {
  const [team1, team2] = getTeamTuple(liveInfo.players, match);

  const round: RoundsInsert = {
    team1_tickets: liveInfo.team1_tickets,
    team2_tickets: liveInfo.team2_tickets,
    server: liveInfo.ip,
    match: match.id,
    team1,
    team2,
    info: liveInfo,
    map: await getMapId(liveInfo),
  };
  return client().createRound(round).then(verifySingleResult);
}

export async function getMapId(info: LiveInfo) {
  const cachedMap = getCachedValue<number>(info.currentMapName);
  if (cachedMap) {
    return cachedMap;
  }

  const { data: map, error: mapError } = await client().searchMap(info.currentMapName);

  if (mapError) {
    logSupabaseError('Failed to create round, map search failed.', mapError);
    return -1;
  }

  setCachedValue(info.currentMapName, map.id);
  return map.id;
}
