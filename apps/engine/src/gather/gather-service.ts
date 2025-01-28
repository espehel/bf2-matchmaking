import { TeamspeakBot } from './TeamspeakBot';
import { info, logErrorMessage } from '@bf2-matchmaking/logging';
import { TeamSpeakClient } from 'ts3-nodejs-library';
import { getTeamspeakPlayer } from '@bf2-matchmaking/services/players';
import { isGatherPlayer } from '@bf2-matchmaking/types';
import { startReadServerTask } from '../tasks/readServerTask';
import { topic } from '@bf2-matchmaking/redis/topic';
import { LiveInfo } from '@bf2-matchmaking/types/engine';
import { Gather } from '@bf2-matchmaking/services/gather';
import { GatherStatus } from '@bf2-matchmaking/types/gather';

export async function initGatherQueue(configId: number) {
  const ts = await TeamspeakBot.connect();

  const stateChange = await Gather(configId).init();

  if (stateChange?.status === GatherStatus.Queueing) {
    await ts.clearQueueChannel();
  }

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
      startReadServerTask('cphdock.bf2.top');
      await topic('server:cphdock.bf2.top').subscribe<LiveInfo>(onLiveInfo);
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

      await topic('server:cphdock.bf2.top').unsubscribe();
      await Gather(configId).reset(false);
    } catch (e) {
      logErrorMessage('Failed to handle live info, hard resetting gather', e, { live });
      await topic('server:cphdock.bf2.top').unsubscribe();
      await Gather(configId).reset(true);
      await ts.clearQueueChannel();
    }
  }
}
