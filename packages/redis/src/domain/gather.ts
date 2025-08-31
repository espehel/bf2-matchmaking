import { list } from '../core/list';
import { getMultiple, json } from '../core/json';
import { GatherPlayer, MatchConfigsRow } from '@bf2-matchmaking/types';
import { GatherState } from '@bf2-matchmaking/types/gather';
import { GatherStateSchema } from '../schemas';
import { hash } from '../core/hash2';
import { hash as oldHash } from '../core/hash';

export const gather = {
  getQueue: (configId: number) => list(`gather:${configId}:queue`),
  getState: (configId: number) =>
    hash<'status' | 'address' | 'summonedAt' | 'failReason'>(`gather:${configId}`),
  getPlayer: (id: string) => json<GatherPlayer>(`gather:players:${id}`).get(),
  setPlayer: (player: GatherPlayer) =>
    json<GatherPlayer>(`gather:players:${player.teamspeak_id}`).set(player),
};

export function popMatchPlayers(configId: number, matchSize: number) {
  return list(`gather:${configId}:queue`).rpopBulk(matchSize);
}

export function returnPlayers(configId: number, players: Array<string>) {
  return list(`gather:${configId}:queue`).rpush(...players);
}

export function getGatherQueue(configId: number) {
  return list(`gather:${configId}:queue`).range();
}

export function getGatherPlayer(identifier: string) {
  return json<GatherPlayer>(`gather:players:${identifier}`).get();
}

export function getGatherPlayers(identifiers: Array<string>) {
  return getMultiple<GatherPlayer>(identifiers.map((id) => `gather:players:${id}`));
}
export function getGatherPlayerKeyhash(identifier: string) {
  return json<GatherPlayer>(`gather:players:${identifier}`).getProperty('keyhash');
}
export async function setGatherPlayer(player: GatherPlayer) {
  if (await json(`gather:players:${player.teamspeak_id}`).exists()) {
    return 'Exists';
  }
  return json<GatherPlayer>(`gather:players:${player.teamspeak_id}`).set(player);
}
export async function getGatherState(configId: number) {
  return GatherStateSchema.parse(
    await oldHash<GatherState>(`gather:${configId}`).getAll()
  );
}
export function getGatherConfig(configId: number) {
  return json<MatchConfigsRow>(`config:${configId}`).get();
}
