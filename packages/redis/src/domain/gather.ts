import { list } from '../core/list';
import { json } from '../core/json';
import { GatherPlayer, TeamspeakPlayer } from '@bf2-matchmaking/types';

export function hasPlayer(player: string) {
  return list('gather:queue').has(player);
}

export function addPlayer(player: string) {
  return list('gather:queue').push(player);
}

export function removePlayer(player: string) {
  return list('gather:queue').remove(player);
}

export function popMatchPlayers(matchSize: number) {
  return list('gather:queue').rpopBulk(matchSize);
}

export function onQueueFull() {}

export function getGatherPlayer(identifier: string) {
  return json<GatherPlayer>(`gather:players:${identifier}`).get();
}
export function getGatherPlayerKeyhash(identifier: string) {
  return json<GatherPlayer>(`gather:players:${identifier}`).getProperty('keyhash');
}
export function setGatherPlayer(player: GatherPlayer) {
  return json<GatherPlayer>(`gather:players:${player.teamspeak_id}`).set(player);
}
