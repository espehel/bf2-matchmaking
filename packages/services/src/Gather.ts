import { hash } from '@bf2-matchmaking/redis/hash';
import { GatherState, GatherStatus } from '@bf2-matchmaking/types/gather';
import { Match } from './Match';
import { assertObj } from '@bf2-matchmaking/utils';
import { MatchStatus } from '@bf2-matchmaking/types';

export function Gather(configId: number) {
  const init = async () => {
    await hash<GatherState>(`gather:${configId}`).set({
      status: GatherStatus.Queueing,
      matchId: null,
    });
  };
  const getStatus = async () => {
    return hash<GatherState>(`gather:${configId}`).get('status');
  };
  const getMatch = async () => {
    const matchId = await hash<GatherState>(`gather:${configId}`).get('matchId');
    assertObj(matchId, `Match ID not found for gather with config ${configId}`);
    return Match.get(matchId);
  };
  const summon = async () => {
    await hash<GatherState>(`gather:${configId}`).set({ status: GatherStatus.Summoning });
  };
  const play = async () => {
    const matchId = await hash<GatherState>(`gather:${configId}`).get('matchId');
    assertObj(matchId, `Match ID not found for gather with config ${configId}`);
    await Match.update(matchId).commit({ status: MatchStatus.Ongoing });
    await hash<GatherState>(`gather:${configId}`).set({ status: GatherStatus.Playing });
  };
  return {
    init,
    getMatch,
    getStatus,
    summon,
    play,
  };
}
