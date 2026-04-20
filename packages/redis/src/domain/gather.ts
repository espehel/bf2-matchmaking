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
  getPlayersByIdentifier: (identifiers: Array<string>) =>
    getMultiple<GatherPlayer>(identifiers.map((id) => `gather:players:${id}`)),
  setPlayer: (player: GatherPlayer) =>
    json<GatherPlayer>(`gather:players:${player.teamspeak_id}`).set(player),
};
