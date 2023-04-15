import { getDiscordClient } from './client';
import { DiscordConfig, isDiscordConfig } from '@bf2-matchmaking/types';

import { error, info } from '@bf2-matchmaking/logging';
import { hasSummonEmbed, isTextBasedChannel } from './utils';
import { sendChannelMessage } from '@bf2-matchmaking/discord';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { listenForMessageReaction } from './reaction-listener';
import { MessageCollector } from 'discord.js';
import { executeCommand, isCommand } from './commands';

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
  if (!config.active) {
    return null;
  }

  const discordClient = await getDiscordClient();
  const channel = await discordClient.channels.fetch(config.channel);

  if (!isTextBasedChannel(channel)) {
    return null;
  }

  const collector = channel.createMessageCollector({
    filter: (m) => isCommand(m) || hasSummonEmbed(m),
  });

  collector.on('collect', async (message) => {
    info(
      'listenToChannel',
      `Received command "${message.content}" in ${config.name} channel`
    );

    if (hasSummonEmbed(message)) {
      listenForMessageReaction(message);
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
  });

  collector.on('end', (collected, reason) => {
    info(
      'listenToChannel',
      `Stopped listening to ${config.name} channel, after collecting ${collected.size} messages, because ${reason}.`
    );
  });
  info('listenToChannel', `Listening to ${config.name}`);
  return collector;
};
