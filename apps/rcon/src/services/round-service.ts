import { MatchesJoined, LiveInfo, ServerInfo } from '@bf2-matchmaking/types';
import { logSupabaseError } from '@bf2-matchmaking/logging';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getCachedValue, setCachedValue } from '@bf2-matchmaking/utils/src/cache';
import { getTeamTuple } from '@bf2-matchmaking/utils/src/round-utils';

export async function insertRound(match: MatchesJoined, liveInfo: LiveInfo) {
  const { players, ip, ...si } = liveInfo;

  const [team1, team2] = getTeamTuple(players, match);

  const round = {
    team1_tickets: liveInfo.team1_tickets,
    team2_tickets: liveInfo.team2_tickets,
    server: ip,
    match: match.id,
    team1,
    team2,
    si: JSON.stringify(si),
    pl: JSON.stringify(players),
    map: await getMapId(si),
  };
  return client().createRound(round).then(verifySingleResult);
}

export async function getMapId(si: ServerInfo) {
  const cachedMap = getCachedValue<number>(si.currentMapName);
  if (cachedMap) {
    return cachedMap;
  }

  const { data: map, error: mapError } = await client().searchMap(si.currentMapName);

  if (mapError) {
    logSupabaseError('Failed to create round, map search failed.', mapError);
    return -1;
  }

  setCachedValue(si.currentMapName, map.id);
  return map.id;
}
