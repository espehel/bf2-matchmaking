import { getDiscordClient } from './client';
import { DiscordConfig, isDiscordConfig } from '@bf2-matchmaking/types';
import { error, info } from '@bf2-matchmaking/logging';
import { isTextBasedChannel } from './discord-utils';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { MessageCollector } from 'discord.js';
import { addDraftListener, addMatchListener } from './match-listener';
import { getDebugChannel } from '../services/message-service';
import { setCachedConfig } from '@bf2-matchmaking/redis';

const channelListenerMap = new Map<string, MessageCollector>();

async function loadChannels() {
  const configs = await client().getMatchConfigs().then(verifyResult);

  for (const config of configs.filter(isDiscordConfig)) {
    const listener = await listenToChannel(config);
    if (listener) {
      channelListenerMap.set(listener.channel.id, listener);
    }
  }
  await listenToDebugChannel();
}
export function hasChannelListener(channel: string) {
  return channelListenerMap.has(channel);
}
export function initChannelListener() {
  loadChannels()
    .then(() =>
      info(
        'initChannelListener',
        `Initialized listener for ${channelListenerMap.size} channels`
      )
    )
    .catch((e) => error('initChannelListener', e));
}

export const addChannelListener = async (channelId: string) => {
  const config = await client()
    .getMatchConfigByChannelId(channelId)
    .then(verifySingleResult);
  const listener = await listenToChannel(config);

  if (listener) {
    channelListenerMap.set(listener.channel.id, listener);
    info('addChannelListener', `Initialized listener for channel ${listener.channel.id}`);
  }
};

export const updateChannelListener = async (channelId: string) => {
  const config = await client()
    .getMatchConfigByChannelId(channelId)
    .then(verifySingleResult);

  const oldListener = channelListenerMap.get(config.channel);
  if (oldListener) {
    oldListener.stop('updating listener');
    info(
      'updateChannelListener',
      `Stopped listener for channel ${oldListener.channel.id}`
    );
  }

  const listener = await listenToChannel(config);
  if (listener) {
    channelListenerMap.set(listener.channel.id, listener);
    info(
      'updateChannelListener',
      `Initialized new listener for channel ${listener.channel.id}`
    );
  }
};
export function removeChannel(channelId: string) {
  const listener = channelListenerMap.get(channelId);
  if (listener) {
    listener.stop('Listener removed');
    channelListenerMap.delete(channelId);
  } else {
    throw new Error(`No listener found for channel ${channelId}`);
  }
}

async function listenToChannel(config: DiscordConfig) {
  try {
    const discordClient = await getDiscordClient();
    const channel = await discordClient.channels.fetch(config.channel);

    if (!isTextBasedChannel(channel)) {
      return null;
    }

    await setCachedConfig(config);
    const collector = channel.createMessageCollector();
    addMatchListener(collector, config);
    return collector;
  } catch (e) {
    error('listenToChannel', e);
  }
}

async function listenToDebugChannel() {
  try {
    const channel = await getDebugChannel();

    const collector = channel.createMessageCollector();
    addDraftListener(collector);
    return collector;
  } catch (e) {
    error('listenToDebugChannel', e);
  }
}
