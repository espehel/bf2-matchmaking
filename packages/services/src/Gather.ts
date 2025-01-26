import { hash } from '@bf2-matchmaking/redis/hash';
import { GatherState, GatherStatus } from '@bf2-matchmaking/types/gather';
import { Match } from './Match';
import { assertObj, hasEqualKeyhash } from '@bf2-matchmaking/utils';
import {
  GatherPlayer,
  isGatherPlayer,
  MatchConfigsRow,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { returnPlayers, setGatherPlayer } from '@bf2-matchmaking/redis/gather';
import { DateTime } from 'luxon';
import { list } from '@bf2-matchmaking/redis/list';
import { json } from '@bf2-matchmaking/redis/json';
import { syncConfig } from './config-service';

export function Gather(configId: number) {
  const init = async () => {
    await syncConfig(configId);
    await hash<GatherState>(`gather:${configId}`).set({
      status: GatherStatus.Queueing,
      matchId: undefined,
      summoningAt: undefined,
    });
  };
  const getState = async () => {
    return hash<GatherState>(`gather:${configId}`).getAll();
  };
  const getStatus = async () => {
    return hash<GatherState>(`gather:${configId}`).get('status');
  };
  const getMatch = async () => {
    const matchId = await hash<GatherState>(`gather:${configId}`).get('matchId');
    assertObj(matchId, `Match ID not found for gather with config ${configId}`);
    return Match.get(matchId);
  };
  const addPlayer = async (player: GatherPlayer) => {
    await setGatherPlayer(player);
    const length = await list('gather:queue').push(player.teamspeak_id);

    const gatherSize = await json<MatchConfigsRow>(`gather:${configId}`).getProperty(
      'size'
    );
    assertObj(gatherSize);
    const status = await hash<GatherState>(`gather:${configId}`).get('status');
    assertObj(status);
    return status === GatherStatus.Queueing && length === gatherSize;
  };
  const summon = async () => {
    await hash<GatherState>(`gather:${configId}`).set({
      status: GatherStatus.Summoning,
      summoningAt: DateTime.now().toISO(),
    });
  };
  const play = async () => {
    const matchId = await hash<GatherState>(`gather:${configId}`).get('matchId');
    assertObj(matchId, `Match ID not found for gather with config ${configId}`);
    await Match.update(matchId).commit({ status: MatchStatus.Ongoing });
    await hash<GatherState>(`gather:${configId}`).set({ status: GatherStatus.Playing });
  };
  const reset = async (connectedPlayers: Array<GatherPlayer>) => {
    const match = await getMatch();
    await returnPlayers(connectedPlayers.map((p) => p.teamspeak_id));

    await Match.remove(match.id, MatchStatus.Deleted);

    await hash<GatherState>(`gather:${configId}`).set({
      status: GatherStatus.Queueing,
      matchId: undefined,
      summoningAt: undefined,
    });

    return match.players
      .filter(isGatherPlayer)
      .filter((p) => !connectedPlayers.some(hasEqualKeyhash(p)));
  };

  return {
    init,
    addPlayer,
    getMatch,
    getState,
    getStatus,
    summon,
    play,
    reset,
  };
}
