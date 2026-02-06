import { info, logErrorMessage, verbose, warn } from '@bf2-matchmaking/logging';
import { isGatherPlayer } from '@bf2-matchmaking/types';
import { ServerApi } from '@bf2-matchmaking/services/server/Server';
import { assertObj, assertString } from '@bf2-matchmaking/utils';
import { gather } from '@bf2-matchmaking/redis/gather';
import {
  GatherStartedListener,
  PlayersSummonedListener,
  TeamSpeakGather,
} from '@bf2-matchmaking/teamspeak/gather';
import { syncConfig } from '@bf2-matchmaking/services/config';
import { getPlayerList, verifyRconResult } from '@bf2-matchmaking/services/rcon';
import { players } from '../lib/supabase';
import { parseError } from '@bf2-matchmaking/services/error';
import { matchService } from '../lib/match';
import { getMatchTeam } from './gather-utils';
import { stream } from '@bf2-matchmaking/redis/stream';

export async function initGather(configId: number) {
  try {
    const config = await syncConfig(configId);
    const address = await ServerApi.findIdle();
    assertString(address, 'No idle server found');

    const gather = await TeamSpeakGather.init(config);
    addEventLogging(gather);
    await addEventStream(gather);
    await gather
      .on('playerJoining', handlePlayerJoining)
      .on('playersSummoned', handlePlayersSummoned)
      .on('summonComplete', handleSummonComplete)
      .on('gatherStarted', handleGatherStarted)
      .on('error', (e) => {
        logErrorMessage(`Gather ${configId}: Error`, e);
      })
      .initQueue(address);
  } catch (e) {
    logErrorMessage(`Gather ${configId}: Failed to initialize`, e);
  }
}

const handlePlayerJoining = async (clientUId: string, gather: TeamSpeakGather) => {
  const { data: player, error } = await players.getByTeamspeakId(clientUId);
  if (error) {
    warn(
      'handlePlayerJoining',
      `Failed to fetch player ${clientUId} from database: ${error.message}`
    );
  }
  if (!player) {
    await gather.rejectPlayer(clientUId, 'tsid');
  } else if (!isGatherPlayer(player)) {
    await gather.rejectPlayer(clientUId, 'keyhash');
  } else {
    await gather.acceptPlayer(clientUId);
  }
};
const handlePlayersSummoned: PlayersSummonedListener = async (
  server,
  clientUIds,
  gather
) => {
  const serverPlayers = await getPlayerList(server).then(verifyRconResult);
  const gatherPlayers = await Promise.all(clientUIds.map(getGatherPlayer));

  const connectedClientUIdList = gatherPlayers
    .filter((gp) => serverPlayers.some((sp) => sp.keyhash === gp.keyhash))
    .map((p) => p.teamspeak_id);

  await gather.verifySummon(connectedClientUIdList);
};
const handleSummonComplete = async (
  clientUIds: Array<string>,
  gather: TeamSpeakGather
) => {
  const players = await Promise.all(clientUIds.map(getGatherPlayer));
  const match = await matchService.createMatch(players, gather.config);
  const team1 = getMatchTeam(match, 1);
  const team2 = getMatchTeam(match, 2);
  await gather.initiateMatchChannels(match.id, team1, team2);
};

const handleGatherStarted: GatherStartedListener = async (
  matchId,
  team1,
  team2,
  gather
) => {
  const address = await ServerApi.findIdle();
  assertString(address, 'No idle server found');
  await gather.nextQueue(address);
};

async function getGatherPlayer(clientUId: string) {
  const cachedPlayer = await gather.getPlayer(clientUId);
  if (cachedPlayer) {
    return cachedPlayer;
  }
  info('getGatherPlayerCached', `Cache miss for player ${clientUId}`);

  const { data: player } = await players.getByTeamspeakId(clientUId);
  assertObj(player, `Player ${clientUId} not found in database`);

  if (isGatherPlayer(player)) {
    await gather.setPlayer(player);
    return player;
  }
  throw new Error(`Player ${clientUId} is not a valid GatherPlayer`);
}

async function getGatherPlayerSafe(clientUId: string) {
  try {
    return await getGatherPlayer(clientUId);
  } catch (e) {
    warn('getGatherPlayerSafe', parseError(e));
    return null;
  }
}

/*export async function initGatherQueue(configId: number) {
  try {
    info('initGatherQueue', `Initializing gather queue for config ${configId}`);
    const ts = await TeamspeakBot.connect();

    // TODO mark server as used for gather somehow
    const address = await Server.findIdle();
    if (!address) {
      await Gather(configId).error('No idle server found');
      return;
    }

    const queueingPlayers = await Promise.all(
      ts.getQueueingPlayers().map((p) => verifyPlayer(p, ts))
    );

    await Gather(configId).init(address, queueingPlayers.filter(isNotNull));

    ts.onClientJoined(handleClientJoin);
    ts.onClientLeft(handleClientLeft);

    async function handleClientJoin(client: TeamSpeakClient) {
      if (await Gather(configId).hasPlayer(client.uniqueIdentifier)) {
        info(
          'listenToChannelJoin',
          `Client ${client.nickname} already in queue, no action taken.`
        );
        return;
      }

      const player = await verifyPlayer(client.uniqueIdentifier, ts);
      if (!player) {
        return;
      }

      const nextState = await Gather(configId).addPlayer(player);
      if (nextState) {
        scheduleReadServerJob(nextState.payload.address).on(
          'finished',
          onLiveInfo(ts, configId, nextState.payload.address)
        );
      }
    }

    async function handleClientLeft(client: TeamSpeakClient) {
      await Gather(configId).removePlayer(client.uniqueIdentifier);
    }
  } catch (e) {
    error('initGatherQueue', e);
    logErrorMessage(`Gather ${configId}: Failed`, e);
    await Gather(configId)
      .error('Unknown Gather Error')
      .catch((e) => error('initGatherQueue', e));
  }
}

function onLiveInfo(ts: TeamspeakBot, configId: number, address: string) {
  return async (name: string, live: LiveInfo) => {
    try {
      info(
        'onLiveInfo',
        `Gather ${configId}: Handling live info at ${address}[${live.players.length} players]`
      );
      const stateChange = await Gather(configId).handleSummonedPlayers(live.players);
      if (!stateChange) {
        return;
      }

      if (stateChange.status === GatherStatus.Playing) {
        await ts.initiateMatchChannels(stateChange.payload);
      }
      if (stateChange.status === GatherStatus.Aborting) {
        await ts.kickLatePlayers(stateChange.payload.map((p) => p.teamspeak_id));
      }

      assertString(address, 'Missing server address');
      stopReadServerJob(address);
      const queueingPlayers = await Promise.all(
        ts.getQueueingPlayers().map((p) => verifyPlayer(p, ts))
      );
      // TODO should probably use the redis list/queueu somehow here
      await Gather(configId).init(address, queueingPlayers.filter(isNotNull));
    } catch (e) {
      logErrorMessage('Failed to handle live info, hard resetting gather', e, {
        live,
      });
      assertString(address, 'Missing server address');
      stopReadServerJob(address);
      await ts.clearQueueChannel();
      await Gather(configId).init(address, []);
    }
  };
}

async function verifyPlayer(identifier: string, ts: TeamspeakBot) {
  const cachedPlayer = await getGatherPlayer(identifier);
  if (cachedPlayer) {
    return cachedPlayer;
  }

  const player = await getTeamspeakPlayer(identifier);
  if (!player) {
    await ts.kickUnregisteredClient(identifier);
    return null;
  }
  if (!isGatherPlayer(player)) {
    await ts.kickClient(identifier, 'Missing keyhash', 'Missing keyhash');
    return null;
  }
  await setGatherPlayer(player);
  return player;
}*/

async function addEventStream(ts: TeamSpeakGather) {
  const events = await stream(`gather:${ts.config.id}:events`);
  ts.on('initiated', async (clientUIds, address) => {
    await events.addEvent('initiated', { clientUIds, address });
  });
  ts.on('playerJoining', async (clientUId) => {
    const player = await getGatherPlayerSafe(clientUId);
    await events.addEvent('playerJoining', {
      clientUId,
      nick: player?.nick || clientUId,
    });
  });
  ts.on('playerJoined', async (clientUId) => {
    const player = await getGatherPlayerSafe(clientUId);
    await events.addEvent('playerJoined', { clientUId, nick: player?.nick || clientUId });
  });
  ts.on('playerRejected', async (clientUId, reason) => {
    const player = await getGatherPlayerSafe(clientUId);
    await events.addEvent('playerRejected', {
      clientUId,
      reason,
      nick: player?.nick || clientUId,
    });
  });
  ts.on('playerLeft', async (clientUId) => {
    const player = await getGatherPlayerSafe(clientUId);
    await events.addEvent('playerLeft', { clientUId, nick: player?.nick || clientUId });
  });
  ts.on('playersSummoned', async (address, clientUIds) => {
    await events.addEvent('playersSummoned', { address, clientUIds });
  });
  ts.on('playerKicked', async (clientUId, reason) => {
    const player = await getGatherPlayerSafe(clientUId);
    await events.addEvent('playerKicked', {
      clientUId,
      reason,
      nick: player?.nick || clientUId,
    });
  });
  ts.on('summonComplete', async (clientUIds) => {
    await events.addEvent('summonComplete', { clientUIds });
  });
  ts.on('playerMoved', async (clientUId, toChannel) => {
    const player = await getGatherPlayerSafe(clientUId);
    await events.addEvent('playerMoved', {
      clientUId,
      toChannel,
      nick: player?.nick || clientUId,
    });
  });
  ts.on('gatherStarted', async (matchId) => {
    await events.addEvent('gatherStarted', { matchId });
  });
  ts.on('nextQueue', async (clientUIds, address, gather) => {
    await events.addEvent('nextQueue', { clientUIds, address });
  });
  ts.on('summonFail', async (missingClientUIds) => {
    await events.addEvent('summonFail', { missingClientUIds });
  });
}

function addEventLogging(ts: TeamSpeakGather) {
  ts.on('initiated', (clientUIds, address) => {
    verbose(
      'Gather',
      `Gather initiated on ${address} with players: ${clientUIds.join(', ')}`
    );
  });
  ts.on('playerJoining', (clientUId) => {
    verbose('Gather', `Player joining gather: ${clientUId}`);
  });
  ts.on('playerJoined', (clientUId) => {
    verbose('Gather', `Player joined gather: ${clientUId}`);
  });
  ts.on('playerRejected', (clientUId, reason) => {
    verbose('Gather', `Player ${clientUId} rejected from gather: ${reason}`);
  });
  ts.on('playerLeft', (clientUId) => {
    verbose('Gather', `Player left gather: ${clientUId}`);
  });
  ts.on('playersSummoned', (server, clientUIds) => {
    verbose('Gather', `Players summoned to server ${server}: ${clientUIds.join(', ')}`);
  });
  ts.on('summonComplete', (clientUIds) => {
    verbose('Gather', `Summon complete with players: ${clientUIds.join(', ')}`);
  });
  ts.on('playerMoved', (clientUId, toChannel) => {
    verbose('Gather', `Player ${clientUId} moved to ${toChannel}`);
  });
  ts.on('gatherStarted', (matchId) => {
    verbose('Gather', `Gather started for match ${matchId}`);
  });
  ts.on('nextQueue', (clientUIds, address, gather) => {
    verbose(
      'Gather',
      `Next queue initiated on ${address} with players: ${clientUIds.join(', ')}`
    );
  });
  ts.on('summonFail', (missingClientUIds) => {
    verbose('Gather', `Summon failed, missing players: ${missingClientUIds.join(', ')}`);
  });
}
