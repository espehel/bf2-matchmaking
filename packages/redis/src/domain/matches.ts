import { isScheduledMatch, MatchesJoined, MatchStatus } from '@bf2-matchmaking/types';
import { info, warn } from '@bf2-matchmaking/logging';
import { MatchdraftsRow } from '@bf2-matchmaking/schemas/types';
import { set, sets } from '../core/set';
import { del } from '../core/generic';
import { getMultiple, json } from '../core/json';
import { matchSchema } from '../schemas';
import { hash } from '../core/hash';
import { Match } from '../types';
import { LiveInfo } from '@bf2-matchmaking/types/engine';
import { getClient } from '../client';
import { DateTime } from 'luxon';

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
  if (entries.length) {
    await hash(`matches:${matchId}:players`).setEntries(entries);
  }
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
  const oldMatch = await json<MatchesJoined>(`matches:${matchId}`).get();

  if (!oldMatch) {
    warn('removeMatch', `Match ${matchId} not found`);
    return;
  }

  const setRemoveRes = await set(`matches:${oldMatch.status}`).remove(matchId.toString());
  const keysDelRes = await del([
    `matches:${matchId}`,
    `matches:${matchId}:servers`,
    `matches:${matchId}:players`,
    `matches:${matchId}:draft`,
    `matches:${matchId}:live`,
    `matches:${matchId}:log`,
  ]);
  info('removeMatch', `Match ${matchId} removed with status ${oldMatch.status}`);
  return { setRemoveRes, jsonDelRes: keysDelRes };
}

export async function getMatchLive(matchId: string | number) {
  return hash(`matches:${matchId}:live`).getAll().then(matchSchema.parse);
}
export async function getMatchLiveSafe(matchId: string | number) {
  try {
    return await getMatchLive(matchId);
  } catch (e) {
    return null;
  }
}

export async function initMatchLive(matchId: string | number) {
  return hash(`matches:${matchId}:live`).set({
    state: 'pending',
    roundsPlayed: '0',
    pendingSince: DateTime.now().toISO(),
  });
}

export async function setMatchLive(matchId: string | number, values: Partial<Match>) {
  return hash(`matches:${matchId}:live`).set(values);
}

export async function incMatchRoundsPlayed(matchId: string | number): Promise<number> {
  return hash(`matches:${matchId}:live`).inc('roundsPlayed', 1);
}

export async function removeLiveMatch(matchId: string) {
  await del(`matches:${matchId}:live`);
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

export function setMatchDraft(draft: MatchdraftsRow) {
  return json(`matches:${draft.match_id}:draft`).set(draft);
}
export async function getOpenMatchDrafts(): Promise<Array<MatchdraftsRow>> {
  const ids = await sets([
    toKey(MatchStatus.Scheduled),
    toKey(MatchStatus.Open),
  ]).members();
  return getMultiple<MatchdraftsRow>(ids.map((id) => `matches:${id}:draft`));
}
export function getMatchDraft(matchId: string | number) {
  return json<MatchdraftsRow>(`matches:${matchId}:draft`).get();
}
