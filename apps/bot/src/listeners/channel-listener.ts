import { getDiscordClient } from '../client';
import {
  DiscordConfig,
  isDiscordConfig,
  MatchConfigModeType,
} from '@bf2-matchmaking/types';
import { error, info } from '@bf2-matchmaking/logging';
import {
  hasSummonEmbed,
  isPubobotMatchDrafting,
  isPubobotMatchStarted,
  isTextBasedChannel,
  replyMessage,
} from '../utils';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import { listenForMatchMessageReaction } from './reaction-listener';
import { Client, Message, MessageCollector } from 'discord.js';
import { executeCommand, isCommand } from '../commands';
import {
  createDraftingMatchFromPubobotEmbed,
  getTopLocationPollResult,
  messageFilter,
  startMatchFromPubobotEmbed,
} from '../match-tracking-service';
import { getMatchStartedEmbed, getRulesEmbedByConfig } from '@bf2-matchmaking/discord';
import { api, verify } from '@bf2-matchmaking/utils';

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
    collector.filter = messageFilter;
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

function passiveCollector(config: DiscordConfig, discordClient: Client<true>) {
  return async (message: Message) => {
    info(
      'passiveCollector',
      `Received embed with title "${message.embeds[0]?.title}" in ${config.name} channel`
    );

    if (isPubobotMatchDrafting(message.embeds[0])) {
      return handlePubobotMatchDrafting(message);
    }

    if (isPubobotMatchStarted(message.embeds[0])) {
      return handlePubobotMatchStarted(message);
    }
  };

  async function handlePubobotMatchDrafting(message: Message) {
    try {
      const match = await createDraftingMatchFromPubobotEmbed(
        message.embeds[0],
        discordClient.users,
        config
      );

      const location = await getTopLocationPollResult(message);
      const name = `${config.name} Match ${match.id}`;
      const dnsName = `m${match.id}`;
      await api.platform().postServers(name, location, config.name, dnsName).then(verify);
    } catch (e) {
      error('passiveCollector', e);
    }
  }
  async function handlePubobotMatchStarted(message: Message) {
    try {
      const match = await startMatchFromPubobotEmbed(
        message.embeds[0],
        discordClient.users
      );

      await replyMessage(message, {
        embeds: [getMatchStartedEmbed(match), getRulesEmbedByConfig(config)],
      });
    } catch (e) {
      error('passiveCollector', e);
    }
  }
}
