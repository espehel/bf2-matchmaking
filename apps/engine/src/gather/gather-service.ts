import { TeamspeakBot } from './TeamspeakBot';
import { error, info, logErrorMessage } from '@bf2-matchmaking/logging';
import { TeamSpeakClient } from 'ts3-nodejs-library';
import { getTeamspeakPlayer } from '@bf2-matchmaking/services/players';
import { isGatherPlayer } from '@bf2-matchmaking/types';
import { startReadServerTask } from '../tasks/readServerTask';
import { topic } from '@bf2-matchmaking/redis/topic';
import { LiveInfo } from '@bf2-matchmaking/types/engine';
import { Gather } from '@bf2-matchmaking/services/gather';
import { GatherStatus } from '@bf2-matchmaking/types/gather';
import { Server } from '@bf2-matchmaking/services/server/Server';
import { assertString } from '@bf2-matchmaking/utils';

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
    const queuePlayers = await ts.getQueueChannelPlayers();
    await Gather(configId).init(address, queuePlayers);

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

      const player = await getTeamspeakPlayer(client.uniqueIdentifier);
      if (!player) {
        await ts.kickUnregisteredClient(client);
        return;
      }
      if (!isGatherPlayer(player)) {
        await ts.kickClient(client, 'Missing keyhash', 'Missing keyhash');
        return;
      }

      const { status } = await Gather(configId).addPlayer(player);
      if (status === GatherStatus.Summoning) {
        assertString(address, 'Missing server address');
        startReadServerTask(address);
        await topic(`server:${address}`).subscribe<LiveInfo>(onLiveInfo);
      }
    }

    async function handleClientLeft(client: TeamSpeakClient) {
      await Gather(configId).removePlayer(client.uniqueIdentifier);
    }

    async function onLiveInfo(live: LiveInfo) {
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
        const queuePlayers = await ts.getQueueChannelPlayers();
        await Gather(configId).init(address, queuePlayers);
      } catch (e) {
        logErrorMessage('Failed to handle live info, hard resetting gather', e, { live });
        assertString(address, 'Missing server address');
        await topic(`server:${address}`).unsubscribe();
        await ts.clearQueueChannel();
        await Gather(configId).init(address, []);
      }
    }
  } catch (e) {
    error('initGatherQueue', e);
    logErrorMessage(`Gather ${configId}: Failed`, e);
    await Gather(configId)
      .error('Unknown Gather Error')
      .catch((e) => error('initGatherQueue', e));
  }
}
