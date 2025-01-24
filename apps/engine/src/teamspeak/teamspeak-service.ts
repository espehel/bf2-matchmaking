import { api } from '@bf2-matchmaking/utils';
import { get4v4BetaConfig } from '../services/supabase-service';
import { info, logMessage } from '@bf2-matchmaking/logging';
import { MatchQueue } from '../match/MatchQueue';
import { isDiscordConfig, MatchesJoined, TeamspeakPlayer } from '@bf2-matchmaking/types';
import { TeamspeakBot } from './TeamspeakBot';

export async function listenToChannelJoin() {
  const config = await get4v4BetaConfig();
  if (!isDiscordConfig(config)) {
    throw new Error('Config does not contain discord channel');
  }
  const queue = await MatchQueue.fromConfig(config);
  queue.onMatchStarted(handleMatchStarted);
  queue.onQueueReset(handleQueueReset);

  const ts = await TeamspeakBot.connect();

  ts.onClientJoined(async (client) => {
    if (queue.has(client.uniqueIdentifier)) {
      info(
        'listenToChannelJoin',
        `Client ${client.nickname} already in queue, no action taken.`
      );
      return;
    }
    const isAdded = await queue.add(client.uniqueIdentifier);
    if (!isAdded) {
      await ts.kickClient(
        client,
        getRegisterPoke(client.uniqueIdentifier),
        getRegisterMessage(client.uniqueIdentifier)
      );
    }
  });

  ts.onClientLeft(async (client) => {
    await queue.delete(client.uniqueIdentifier);
  });

  async function handleQueueReset(latePlayers: Array<TeamspeakPlayer>) {
    const kickMessage = 'You failed to join server in time and are removed from queue';
    await Promise.all(
      latePlayers.map((player) =>
        ts.kickClient(player.teamspeak_id, kickMessage, kickMessage)
      )
    );
  }

  async function handleMatchStarted(
    match: MatchesJoined,
    players: Array<TeamspeakPlayer>
  ) {
    await ts.initiateMatchChannels(match, players);
    logMessage(`Config ${config.name}: Match started`, { match, players, queue });
  }
}
