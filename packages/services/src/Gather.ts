import {
  GatherState,
  GatherStatus,
  PlayingStatusChange,
  AbortingStatusChange,
  QueueingStatusChange,
} from '@bf2-matchmaking/types/gather';
import { Match } from './Match';
import { assertObj, hasEqualKeyhash } from '@bf2-matchmaking/utils';
import {
  GatherPlayer,
  isGatherPlayer,
  isNotNull,
  MatchConfigsRow,
  MatchesJoined,
  MatchStatus,
  PlayerListItem,
} from '@bf2-matchmaking/types';
import {
  getGatherPlayerKeyhash,
  popMatchPlayers,
  returnPlayers,
  setGatherPlayer,
} from '@bf2-matchmaking/redis/gather';
import { DateTime } from 'luxon';
import { hash } from '@bf2-matchmaking/redis/hash';
import { list } from '@bf2-matchmaking/redis/list';
import { json } from '@bf2-matchmaking/redis/json';
import { getMatchConfig, syncConfig } from './config-service';
import { createMatch } from './match-service';

export function Gather(configId: number) {
  const stateKey = `gather:${configId}`;
  const queueKey = `gather:${configId}:queue`;
  const init = async (): Promise<QueueingStatusChange | null> => {
    await syncConfig(configId);
    const state = await _getState();

    if (state?.status) {
      return null;
    }

    await hash<GatherState>(stateKey).set({
      status: GatherStatus.Queueing,
      matchId: undefined,
      summoningAt: undefined,
    });
    await list(queueKey).del();
    return {
      prevStatus: null,
      status: GatherStatus.Queueing,
      payload: null,
    };
  };

  const _getState = async () => {
    return hash<GatherState>(stateKey).getAll();
  };

  const _getMatch = async () => {
    const matchId = await hash<GatherState>(stateKey).get('matchId');
    assertObj(matchId, `Match ID not found for gather with config ${configId}`);
    return Match.get(matchId);
  };

  const addPlayer = async (player: GatherPlayer) => {
    await setGatherPlayer(player);
    const state = await _getState();
    const queueLength = await list(queueKey).push(player.teamspeak_id);

    const gatherSize = await json<MatchConfigsRow>(stateKey).getProperty('size');
    assertObj(gatherSize);

    if (state.status === GatherStatus.Queueing && queueLength === gatherSize) {
      return _summon();
    }
    return state;
  };

  const removePlayer = async (player: string) => {
    return list(queueKey).remove(player);
  };

  const hasPlayer = async (player: string) => {
    return list(queueKey).has(player);
  };

  const _summon = async () => {
    const config = await getMatchConfig(configId);
    const matchPlayers = await popMatchPlayers(config.size);
    assertObj(matchPlayers, 'Match players not found');

    const keyhashes = (
      await Promise.all(matchPlayers.map(getGatherPlayerKeyhash))
    ).filter(isNotNull);
    await createMatch(keyhashes, config);

    await hash<GatherState>(stateKey).set({
      status: GatherStatus.Summoning,
      summoningAt: DateTime.now().toISO(),
    });
    return _getState();
  };

  const handleSummonedPlayers = async (connectedPlayers: Array<PlayerListItem>) => {
    const config = await getMatchConfig(configId);
    const state = await _getState();
    if (state.status !== GatherStatus.Summoning || !state.summoningAt) {
      throw new Error('Invalid gather state: not summoning');
    }

    const match = await _getMatch();
    const gatherPlayers = match.players.filter(isGatherPlayer);
    if (gatherPlayers.length !== match.players.length) {
      throw new Error('Invalid gather state: not all match players are gather players');
    }

    const readyPlayers = gatherPlayers.filter((player) =>
      connectedPlayers.some(hasEqualKeyhash(player))
    );

    if (readyPlayers.length === config.size) {
      return _play(match);
    }

    if (DateTime.fromISO(state.summoningAt).plus({ minutes: 10 }) < DateTime.now()) {
      return _abort(readyPlayers);
    }
    return null;
  };

  const _play = async (match: MatchesJoined): Promise<PlayingStatusChange> => {
    const state = await _getState();

    await Match.update(match.id).commit({ status: MatchStatus.Ongoing });
    await hash<GatherState>(stateKey).set({ status: GatherStatus.Playing });

    return {
      prevStatus: state.status,
      status: GatherStatus.Playing,
      payload: match,
    };
  };

  const _abort = async (
    connectedPlayers: Array<GatherPlayer>
  ): Promise<AbortingStatusChange> => {
    const state = await _getState();
    const match = await _getMatch();

    await returnPlayers(connectedPlayers.map((p) => p.teamspeak_id));
    await Match.remove(match.id, MatchStatus.Deleted);
    await hash<GatherState>(stateKey).set({
      status: GatherStatus.Aborting,
    });

    const latePlayers = match.players
      .filter(isGatherPlayer)
      .filter((p) => !connectedPlayers.some(hasEqualKeyhash(p)));

    return {
      prevStatus: state.status,
      status: GatherStatus.Aborting,
      payload: latePlayers,
    };
  };

  const reset = async (hard: boolean): Promise<QueueingStatusChange> => {
    const state = await _getState();
    await hash<GatherState>(stateKey).set({
      status: GatherStatus.Queueing,
      matchId: undefined,
      summoningAt: undefined,
    });

    if (hard) {
      await list(queueKey).del();
    }

    return {
      prevStatus: state.status,
      status: GatherStatus.Queueing,
      payload: null,
    };
  };

  return {
    init,
    addPlayer,
    removePlayer,
    hasPlayer,
    handleSummonedPlayers,
    reset,
  };
}
