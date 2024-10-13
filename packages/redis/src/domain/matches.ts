import {
  isScheduledMatch,
  MatchesJoined,
  MatchesRow,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { info, warn } from '@bf2-matchmaking/logging';
import { set, sets } from '../core/set';
import { del, matchKeys } from '../core/generic';
import { getMultiple, json, setMultiple } from '../core/json';
import { matchSchema } from '../schemas';
import { hash } from '../core/hash';
import { Match } from '../types';
import { LiveInfo } from '@bf2-matchmaking/types/engine';
import { getClient } from '../client';

const activeStatuses: string[] = [
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

const startedStatuses = [
  MatchStatus.Summoning,
  MatchStatus.Drafting,
  MatchStatus.Ongoing,
  MatchStatus.Finished,
];

export async function resetMatches(matches: MatchesJoined[]) {
  const activeMatches = await sets(activeStatuses.map(toKey)).members();

  let delMatches = 0;
  if (activeMatches.length) {
    delMatches = await del(activeMatches.map(toKey));
  }
  const delStatuses = await del(activeStatuses.map(toKey));
  info('resetMatches', `Deleted ${delMatches} matches and ${delStatuses} match sets`);

  for (const status of activeStatuses) {
    const matchesWithStatus = matches.filter((m) => m.status === status);
    if (!matchesWithStatus.length) {
      continue;
    }

    const addedToSet = await set(`matches:${status}`).add(
      ...matchesWithStatus.map((m) => m.id.toString())
    );
    const result = await setMultiple(
      matchesWithStatus.map((m) => [`matches:${m.id}`, m])
    );
    info(
      `resetMatches:${status}`,
      `Added ${addedToSet}/${matchesWithStatus.length} to set, json result: ${result}`
    );
  }
}

export async function getWithStatus(status: MatchStatus) {
  const matchIds = await set(`matches:${status}`).members();
  return getMultiple<MatchesJoined>(matchIds.map(toKey));
}

export async function getStarted() {
  const matchIds = await sets(startedStatuses.map(toKey)).members();
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
  if (!activeStatuses.includes(match.status)) {
    warn('putMatch', `Match ${match.id} has invalid status ${match.status}`);
    return;
  }

  const matchJson = json<MatchesJoined>(`matches:${match.id}`);

  if (!(await matchJson.exists())) {
    await matchJson.set(match);
    await set(`matches:${match.status}`).add(match.id.toString());
    info('putMatch', `Match ${match.id} added with status ${match.status}`);
    return;
  }

  await matchJson.set(match);
  info('putMatch', `Match ${match.id} updated`);
}

export async function updateMatchSets(newMatch: MatchesRow, oldMatch: MatchesRow) {
  const matchJson = json<MatchesJoined>(`matches:${newMatch.id}`);
  if (!activeStatuses.includes(newMatch.status)) {
    warn('updateMatchSets', `Match ${newMatch.id} has invalid status ${newMatch.status}`);
    return null;
  }
  if (!(await matchJson.exists())) {
    warn('updateMatchSets', `Match ${newMatch.id} not found`);
    return null;
  }

  await set(`matches:${oldMatch.status}`).remove(newMatch.id.toString());
  await set(`matches:${newMatch.status}`).add(newMatch.id.toString());
  info(
    'updateMatchSets',
    `Match ${newMatch.id} updated status ${oldMatch.status} to ${newMatch.status}`
  );
  return 'ok';
}

export async function removeMatch(match: MatchesRow) {
  const matchJson = json<MatchesJoined>(`matches:${match.id}`);

  if (!(await matchJson.exists())) {
    info('removeMatch', `Match ${match.id} not found`);
    return;
  }

  await set(`matches:${match.status}`).remove(match.id.toString());
  await matchJson.del();
  info('removeMatch', `Match ${match.id} removed with status ${match.status}`);
}

export async function updateMatchProperties(newMatch: MatchesRow) {
  const matchJson = json<MatchesJoined>(`matches:${newMatch.id}`);
  const match = await matchJson.get();
  if (!match) {
    warn('updateMatchProperties', `Match ${newMatch.id} not found`);
    return;
  }

  for (const [key, value] of Object.entries(newMatch)) {
    if (match[key as keyof MatchesRow] !== value) {
      await matchJson.setProperty(key as keyof MatchesRow, value);
      info('updateMatchProperties', `Match ${newMatch.id} updated ${key} to ${value}`);
    }
  }
}

export async function getLiveMatches() {
  return hash('servers:active').keys();
}

export async function getMatchesLive() {
  return set('matches:live').members();
}
export async function addMatchesLive(matchId: string) {
  return set('matches:live').add(matchId);
}
export async function removeMatchesLive(matchId: string) {
  return set('matches:live').remove(matchId);
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
  await set('matches:live').remove(matchId);
}

export function addMatchServer(matchId: string | number, address: string) {
  return set(`matches:${matchId}:servers`).add(address);
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
