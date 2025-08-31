import { TeamspeakBot } from './TeamspeakBot';
import { error, info, logErrorMessage, warn } from '@bf2-matchmaking/logging';
import { TeamSpeakClient } from 'ts3-nodejs-library';
import { getTeamspeakPlayer } from '@bf2-matchmaking/services/players';
import { isGatherPlayer, isNotNull } from '@bf2-matchmaking/types';
import { scheduleReadServerJob, stopReadServerJob } from '../jobs/readServerTask';
import { LiveInfo } from '@bf2-matchmaking/types/engine';
import { Gather } from '@bf2-matchmaking/services/gather';
import { GatherStatus } from '@bf2-matchmaking/types/gather';
import { Server } from '@bf2-matchmaking/services/server/Server';
import { assertObj, assertString } from '@bf2-matchmaking/utils';
import { gather, setGatherPlayer } from '@bf2-matchmaking/redis/gather';
import {
  PlayersSummonedListener,
  TeamSpeakGatherEvents,
} from '@bf2-matchmaking/teamspeak/events';
import { syncConfig } from '@bf2-matchmaking/services/config';
import { getPlayerList, verifyRconResult } from '@bf2-matchmaking/services/rcon';
import { players } from '../lib/supabase';
import { parseError } from '@bf2-matchmaking/services/error';

export async function initGather(configId: number) {
  try {
    const config = await syncConfig(configId);
    // TODO mark server as used for gather somehow
    const address = await Server.findIdle();
    assertString(address, 'No idle server found');

    const gather = new TeamSpeakGatherEvents(config);
    await gather
      .on('playerJoining', handlePlayerJoining)
      .on('playersSummoned', handlePlayersSummoned)
      .on('summonComplete', handleSummonComplete)
      .on('error', (e) => {
        logErrorMessage(`Gather ${configId}: Error`, e);
      })
      .init(address);
  } catch (e) {
    logErrorMessage(`Gather ${configId}: Failed to initialize`, e);
  }
}

const handlePlayerJoining = async (clientUId: string, gather: TeamSpeakGatherEvents) => {
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
  gather: TeamSpeakGatherEvents
) => {
  const players = await Promise.all(clientUIds.map(getGatherPlayer));
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

function addEventLogging(ts: TeamSpeakGatherEvents) {
  ts.on('initiated', () => {});
}
