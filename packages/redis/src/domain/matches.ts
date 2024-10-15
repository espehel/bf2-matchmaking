import { isScheduledMatch, MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { info, warn } from '@bf2-matchmaking/logging';
import { set, sets } from '../core/set';
import { del } from '../core/generic';
import { getMultiple, json } from '../core/json';
import { matchSchema } from '../schemas';
import { hash } from '../core/hash';
import { Match } from '../types';
import { LiveInfo } from '@bf2-matchmaking/types/engine';
import { getClient } from '../client';

const validStatuses: string[] = [
  MatchStatus.Open,
  MatchStatus.Scheduled,
  MatchStatus.Summoning,
  MatchStatus.Drafting,
  MatchStatus.Ongoing,
  MatchStatus.Finished,
];
function toKey(value: string) {
  return `matches:${value}`;
}

export async function getWithStatus(...status: Array<MatchStatus>) {
  const matchIds = await sets(status.map(toKey)).members();
  return getMultiple<MatchesJoined>(matchIds.map(toKey));
}

export async function getScheduled() {
  const matches = await getWithStatus(MatchStatus.Scheduled);
  return matches.filter(isScheduledMatch);
}

export async function getMatch(matchId: string | number) {
  return json<MatchesJoined>(`matches:${matchId}`).get();
}
export async function getPlayers(matchId: string | number) {
  return hash<Record<string, string>>(`matches:${matchId}:players`).getAll();
}

export async function updatePlayers(matchId: string | number, liveInfo: LiveInfo) {
  const now = new Date().toISOString();
  const entries: Array<[string, string]> = liveInfo.players
    .filter((player) => !player.getName.includes('STREAM'))
    .map((player) => [player.keyhash, now]);
  return hash(`matches:${matchId}:players`).setEntries(entries);
}

export async function putMatch(match: MatchesJoined) {
  if (!validStatuses.includes(match.status)) {
    warn('putMatch', `Match ${match.id} has invalid status ${match.status}`);
    return;
  }

  const matchJson = json<MatchesJoined>(`matches:${match.id}`);
  const oldMatch = await matchJson.get();

  if (!oldMatch) {
    const jsonSetRes = await matchJson.set(match);
    const setAddRes = await set(`matches:${match.status}`).add(match.id.toString());
    info('putMatch', `Match ${match.id} added with status ${match.status}`);
    return { jsonSetRes, setAddRes };
  }

  const jsonSetRes = await matchJson.set(match);
  if (oldMatch.status === match.status) {
    info('putMatch', `Match ${match.id} updated`);
    return { jsonSetRes };
  }

  const setRemoveRes = await set(`matches:${oldMatch.status}`).remove(
    match.id.toString()
  );
  const setAddRes = await set(`matches:${match.status}`).add(match.id.toString());
  info('putMatch', `Match ${match.id} updated (${oldMatch.status} -> ${match.status})`);
  return { jsonSetRes, setRemoveRes, setAddRes };
}

export async function removeMatch(matchId: string | number) {
  const matchJson = json<MatchesJoined>(`matches:${matchId}`);
  const oldMatch = await matchJson.get();

  if (!oldMatch) {
    warn('removeMatch', `Match ${matchId} not found`);
    return;
  }

  const setRemoveRes = await set(`matches:${oldMatch.status}`).remove(matchId.toString());
  const jsonDelRes = await matchJson.del();
  info('removeMatch', `Match ${matchId} removed with status ${oldMatch.status}`);
  return { setRemoveRes, jsonDelRes };
}

export async function getMatchLive(matchId: string | number) {
  return hash(`matches:live:${matchId}`).getAll().then(matchSchema.parse);
}
export async function getMatchLiveSafe(matchId: string | number) {
  try {
    return await getMatchLive(matchId);
  } catch (e) {
    return null;
  }
}
export async function setMatchLive(matchId: string | number, values: Partial<Match>) {
  return hash(`matches:live:${matchId}`).set(values);
}

export async function incMatchRoundsPlayed(matchId: string | number): Promise<number> {
  return hash(`matches:live:${matchId}`).inc('roundsPlayed', 1);
}

export async function removeLiveMatch(matchId: string) {
  await del(`matches:live:${matchId}`);
}

export function addMatchServer(matchId: string | number, ...address: Array<string>) {
  return set(`matches:${matchId}:servers`).add(...address);
}
export function removeMatchServer(matchId: string | number, address: string) {
  return set(`matches:${matchId}:servers`).remove(address);
}
export function getMatchServers(matchId: string | number) {
  return set(`matches:${matchId}:servers`).members();
}
export function isMatchServer(matchId: string | number, address: string) {
  return set(`matches:${matchId}:servers`).isMember(address);
}

export async function cleanUpPubobotMatch(matchId: number | string) {
  const client = await getClient();

  for await (const key of client.scanIterator({ MATCH: 'pubobot:*' })) {
    const mid = await hash(key).get('matchId');
    if (matchId == mid) {
      await del(key);
      return key;
    }
  }

  return null;
}
