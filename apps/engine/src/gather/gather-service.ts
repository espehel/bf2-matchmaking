import { TeamspeakBot } from './TeamspeakBot';
import { error, info, logErrorMessage } from '@bf2-matchmaking/logging';
import { TeamSpeakClient } from 'ts3-nodejs-library';
import { getTeamspeakPlayer } from '@bf2-matchmaking/services/players';
import { isGatherPlayer, isNotNull } from '@bf2-matchmaking/types';
import { startReadServerTask } from '../tasks/readServerTask';
import { topic } from '@bf2-matchmaking/redis/topic';
import { LiveInfo } from '@bf2-matchmaking/types/engine';
import { Gather } from '@bf2-matchmaking/services/gather';
import { GatherStatus } from '@bf2-matchmaking/types/gather';
import { Server } from '@bf2-matchmaking/services/server/Server';
import { assertString } from '@bf2-matchmaking/utils';
import { getGatherPlayer, setGatherPlayer } from '@bf2-matchmaking/redis/gather';

export async function initGatherQueue(configId: number) {
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
        startReadServerTask(nextState.payload.address);
        await topic(`server:${nextState.payload.address}`).subscribe<LiveInfo>(
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
  return async (live: LiveInfo) => {
    try {
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
      await topic(`server:${address}`).unsubscribe();
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
      await topic(`server:${address}`).unsubscribe();
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
}
