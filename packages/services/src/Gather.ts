import {
  GatherState,
  GatherStatus,
  StartingStatusChange,
  AbortingStatusChange,
  StatusChange,
  SummoningStatusChange,
} from '@bf2-matchmaking/types/gather';
import { assertObj, hasEqualKeyhash } from '@bf2-matchmaking/utils';
import {
  GatherPlayer,
  isGatherPlayer,
  isNotNull,
  MatchConfigsRow,
  MatchesJoined,
  MatchPlayersRow,
  MatchStatus,
  PlayerListItem,
} from '@bf2-matchmaking/types';
import {
  getGatherPlayer,
  getGatherPlayerKeyhash,
  getGatherState,
  popMatchPlayers,
  returnPlayers,
} from '@bf2-matchmaking/redis/gather';
import { DateTime } from 'luxon';
import { hash } from '@bf2-matchmaking/redis/hash';
import { list } from '@bf2-matchmaking/redis/list';
import { json } from '@bf2-matchmaking/redis/json';
import { getMatchConfig, syncConfig } from './config-service';
import { info, logMessage, logWarnMessage } from '@bf2-matchmaking/logging';
import { stream } from '@bf2-matchmaking/redis/stream';
import { createServiceClient } from '@bf2-matchmaking/supabase';
import { createMatchApi } from './match/match-api';
import { createMatchService } from './match/match-service';

export function Gather(configId: number) {
  const configKey = `config:${configId}`;
  const stateKey = `gather:${configId}`;
  const queueKey = `gather:${configId}:queue`;

  const matchApi = createMatchApi(createServiceClient());
  const matchService = createMatchService(matchApi);

  const init = async (address: string, queueingPlayers: Array<GatherPlayer>) => {
    await syncConfig(configId);
    await _syncPlayers(queueingPlayers.map((p) => p.teamspeak_id));

    await hash<GatherState>(stateKey).set({
      status: GatherStatus.Queueing,
      matchId: undefined,
      summoningAt: undefined,
      failReason: undefined,
      address,
    });

    logMessage(`Gather ${configId}: initiated`, {
      address,
      teamspeakPlayers: queueingPlayers,
    });

    await stream(`gather:${configId}:events`).addEvent('initiated', {
      address,
      playerCount: queueingPlayers.length,
    });
  };

  const _nextState = async <T extends StatusChange>(
    nextState: Partial<GatherState>,
    payload: T['payload']
  ): Promise<T> => {
    const state = await getGatherState(configId).catch(() => null);
    await hash<GatherState>(stateKey).set(nextState);
    const stateChange = {
      prevStatus: state?.status || null,
      status: nextState.status,
      payload,
    } as T;

    if (nextState.status === GatherStatus.Failed) {
      logWarnMessage(
        `Gather ${configId}: state change from ${state?.status || null} to ${
          nextState.status
        }`,
        { prevState: state, nextState, payload }
      );
    } else {
      logMessage(
        `Gather ${configId}: state change from ${state?.status || null} to ${
          nextState.status
        }`,
        { prevState: state, nextState, payload }
      );
    }

    await stream(`gather:${configId}:events`).addEvent('stateChange', stateChange);

    return stateChange;
  };

  const _getMatch = async () => {
    const matchId = await hash<GatherState>(stateKey).get('matchId');
    assertObj(matchId, `Match ID not found for gather with config ${configId}`);
    return matchApi.get(matchId);
  };

  const _syncPlayers = async (teamspeakPlayers: Array<string>) => {
    const queuePlayers = await list(queueKey).range();

    const playersToAdd = teamspeakPlayers.filter((p) => !queuePlayers.includes(p));
    const playersToRemove = queuePlayers.filter((p) => !teamspeakPlayers.includes(p));

    const playersRemoved = await Promise.all(playersToRemove.map(list(queueKey).remove));
    const playersAdded = await list(queueKey).push(...playersToAdd);

    logMessage(`Gather ${configId}: Synced players`, {
      teamspeakPlayers,
      queuePlayers,
      playersToAdd,
      playersToRemove,
      playersAdded,
      playersRemoved: playersRemoved.reduce((a, c) => a + c, 0),
    });
  };

  const addPlayer = async (player: GatherPlayer) => {
    const state = await getGatherState(configId);
    const queueLength = await list(queueKey).push(player.teamspeak_id);
    await stream(`gather:${configId}:events`).addEvent('playerJoin', player);

    const gatherSize = await json<MatchConfigsRow>(configKey).getProperty('size');
    assertObj(gatherSize);

    if (state.status === GatherStatus.Queueing && queueLength === gatherSize) {
      return _summon(state.address);
    }
    return null;
  };

  const removePlayer = async (player: string) => {
    const count = await list(queueKey).remove(player);
    const playerData = await getGatherPlayer(player);
    assertObj(playerData, 'Gather Player not found');
    await stream(`gather:${configId}:events`).addEvent('playerLeave', playerData);
    return count;
  };

  const hasPlayer = async (player: string) => {
    return list(queueKey).has(player);
  };

  const _summon = async (address: string): Promise<SummoningStatusChange> => {
    const config = await getMatchConfig(configId);
    const matchPlayers = await popMatchPlayers(configId, config.size);
    assertObj(matchPlayers, 'Match players not found');

    const players = (await Promise.all(matchPlayers.map(getGatherPlayer))).filter(
      isNotNull
    );
    await matchService.createMatch(players, config);

    return _nextState(
      {
        status: GatherStatus.Summoning,
        summoningAt: DateTime.now().toISO(),
      },
      { address }
    );
  };

  const handleSummonedPlayers = async (connectedPlayers: Array<PlayerListItem>) => {
    const config = await getMatchConfig(configId);
    const state = await getGatherState(configId);
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
    await matchApi
      .update(match.id)
      .updateTeams(...match.teams.map(withReadyState(readyPlayers)))
      .commit();

    if (readyPlayers.length === config.size) {
      info(
        'handleSummonedPlayers',
        `Gather ${configId}: All players connected, starting match`
      );
      return _play(match);
    }

    if (DateTime.fromISO(state.summoningAt).plus({ minutes: 10 }) < DateTime.now()) {
      info('handleSummonedPlayers', `Gather ${configId}: Timeout, aborting match`);
      return _abort(readyPlayers);
    }
    return null;
  };

  const _play = async (match: MatchesJoined): Promise<StartingStatusChange> => {
    const updatedMatch = await matchApi.update(match.id).commit({
      status: MatchStatus.Ongoing,
    });
    return _nextState({ status: GatherStatus.Starting }, updatedMatch);
  };

  const _abort = async (
    connectedPlayers: Array<GatherPlayer>
  ): Promise<AbortingStatusChange> => {
    const match = await _getMatch();

    await returnPlayers(
      configId,
      connectedPlayers.map((p) => p.teamspeak_id)
    );
    await matchApi.remove(match.id, MatchStatus.Deleted);

    const latePlayers = match.players
      .filter(isGatherPlayer)
      .filter((p) => !connectedPlayers.some(hasEqualKeyhash(p)));

    return _nextState(
      {
        status: GatherStatus.Aborting,
      },
      latePlayers
    );
  };

  const error = async (reason: string) => {
    return _nextState(
      {
        status: GatherStatus.Failed,
        failReason: reason,
        address: 'invalid',
        summoningAt: undefined,
        matchId: undefined,
      },
      null
    );
  };

  const del = async () => {
    const stateResult = await hash(stateKey).del();
    const queueResult = await list(queueKey).del();
    await stream(`gather:${configId}:events`).addEvent('deleted', {
      state: stateResult,
      queue: queueResult,
    });
    logMessage(`Gather ${configId}: deleted state and player queue`, {
      stateResult,
      queueResult,
    });
    return { stateResult, queueResult };
  };

  return {
    init,
    addPlayer,
    removePlayer,
    hasPlayer,
    handleSummonedPlayers,
    error,
    del,
  };
}

function withReadyState(readyPlayers: Array<GatherPlayer>) {
  const playerIds = readyPlayers.map((p) => p.id);
  return ({ player_id, match_id }: MatchPlayersRow) => ({
    player_id,
    match_id,
    ready: playerIds.includes(player_id),
  });
}
