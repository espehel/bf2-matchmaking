import { LiveRound, ServerInfo } from '@bf2-matchmaking/types';
import { logSupabaseError } from '@bf2-matchmaking/logging';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { getCachedValue, setCachedValue } from '@bf2-matchmaking/utils/src/cache';
import { LiveMatch } from './LiveMatch';
import { getTeamTuple } from '@bf2-matchmaking/utils/src/round-utils';
import { LiveServer } from '../net/LiveServer';

export function createLiveRound(liveMatch: LiveMatch, liveServer: LiveServer): LiveRound {
  const { players, ip, ...si } = liveServer.info;
  const mergedPl = players
    .concat(liveMatch.liveRound?.pl || [])
    .filter(
      (p, i, self) => self.findIndex((otherP) => otherP.keyhash === p.keyhash) === i
    );

  const [team1, team2] = getTeamTuple(mergedPl, liveMatch.match);

  return {
    team1_tickets: liveServer.info.team1_tickets,
    team2_tickets: liveServer.info.team2_tickets,
    map: liveServer.info.currentMapName,
    server: ip,
    match: liveMatch.match.id,
    team1,
    team2,
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

  const { data: map, error: mapError } = await client().searchMap(si.currentMapName);

  if (mapError) {
    logSupabaseError('Failed to create round, map search failed.', mapError);
    return -1;
  }

  setCachedValue(si.currentMapName, map.id);
  return map.id;
}
