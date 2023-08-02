import { getDiscordClient } from '../client';
import {
  DiscordConfig,
  isDiscordConfig,
  MatchConfigModeType,
  RconBf2Server,
} from '@bf2-matchmaking/types';

import { error, info } from '@bf2-matchmaking/logging';
import { hasSummonEmbed, isPubobotMatchStarted, isTextBasedChannel } from '../utils';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { listenForMatchMessageReaction } from './reaction-listener';
import { Client, Message, MessageCollector, TextChannel } from 'discord.js';
import { executeCommand, isCommand } from '../commands';
import {
  createMatchFromPubobotEmbed,
  sendServerPollMessage,
} from '../match-tracking-service';

const listenerMap = new Map<string, MessageCollector>();
export const initChannelListener = async () => {
  const configs = await client().getMatchConfigs().then(verifyResult);

  for (const config of configs.filter(isDiscordConfig)) {
    const listener = await listenToChannel(config);
    if (listener) {
      listenerMap.set(listener.channel.id, listener);
    }
  }

  info(
    'initChannelListener',
    `Initialized listener for following channels: ${[...listenerMap.keys()].join(', ')}`
  );
};

export const addChannelListener = async (channelId: string) => {
  const config = await client()
    .getMatchConfigByChannelId(channelId)
    .then(verifySingleResult);
  const listener = await listenToChannel(config);

  if (listener) {
    listenerMap.set(listener.channel.id, listener);
    info('addChannelListener', `Initialized listener for channel ${listener.channel.id}`);
  }
};

export const updateChannelListener = async (channelId: string) => {
  const config = await client()
    .getMatchConfigByChannelId(channelId)
    .then(verifySingleResult);

  const oldListener = listenerMap.get(config.channel);
  if (oldListener) {
    oldListener.stop('updating listener');
    info(
      'updateChannelListener',
      `Stopped listener for channel ${oldListener.channel.id}`
    );
  }

  const listener = await listenToChannel(config);
  if (listener) {
    listenerMap.set(listener.channel.id, listener);
    info(
      'updateChannelListener',
      `Initialized new listener for channel ${listener.channel.id}`
    );
  }
};

export const listenToChannel = async (config: DiscordConfig) => {
  if (config.mode === MatchConfigModeType.Inactive) {
    return null;
  }

  const discordClient = await getDiscordClient();
  const channel = await discordClient.channels.fetch(config.channel);

  if (!isTextBasedChannel(channel)) {
    return null;
  }

  const collector = channel.createMessageCollector();

  if (config.mode === MatchConfigModeType.Active) {
    collector.filter = (m) => isCommand(m) || hasSummonEmbed(m);
    collector.on('collect', activeCollector(config));
  }

  if (config.mode === MatchConfigModeType.Passive) {
    collector.filter = (m) =>
      isPubobotMatchStarted(m.embeds[0]) || m.content === 'test embed';
    collector.on('collect', passiveCollector(config, discordClient));
  }

  collector.on('end', (collected, reason) => {
    info(
      'listenToChannel',
      `Stopped listening to ${config.name} channel, after collecting ${collected.size} messages, because ${reason}.`
    );
  });
  info('listenToChannel', `Listening to ${config.name} with mode ${config.mode}`);
  return collector;
};

const activeCollector = (config: DiscordConfig) => async (message: Message) => {
  info(
    'activeCollector',
    `Received command "${message.content}" in ${config.name} channel`
  );

  if (hasSummonEmbed(message)) {
    listenForMatchMessageReaction(message);
  }

  try {
    await executeCommand(message, config);
  } catch (e) {
    if (e instanceof Error) {
      error('discord-gateway', e.message);
    } else if (typeof e === 'string') {
      error('discord-gateway', e);
    } else {
      error('discord-gateway', JSON.stringify(e));
    }
  }
};

const passiveCollector =
  (config: DiscordConfig, discordClient: Client<true>) => async (message: Message) => {
    if (!isTextBasedChannel(message.channel)) {
      return;
    }

    info(
      'passiveCollector',
      `Received embed with title "${message.embeds[0]?.title}" in ${config.name} channel`
    );

    if (!isPubobotMatchStarted(message.embeds[0])) {
      return;
    }

    await sendServerPollMessage(config, message.channel, handleServerSelected);
    async function handleServerSelected(server: RconBf2Server) {
      const { data, error: e } = await createMatchFromPubobotEmbed(
        message.embeds[0],
        discordClient.users,
        config.id,
        server.ip
      );
      if (e) {
        error('passiveCollector', e);
      }
      if (data) {
        info('passiveCollector', `Created match ${data.id} for ${config.name} channel`);
      }
    }
  };
