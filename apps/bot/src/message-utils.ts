import { sendChannelMessage } from '@bf2-matchmaking/discord';
import { APIEmbed, Message } from 'discord.js';
import { DiscordConfig, isDiscordConfig, MatchConfigsRow } from '@bf2-matchmaking/types';
import { getDiscordClient } from './client';
import { isTextBasedChannel } from './utils';

export const reply = async (msg: Message, content: string) =>
  sendChannelMessage(msg.channelId, { content });
export const replyEmbeds = async (msg: Message, embeds: Array<APIEmbed>) =>
  sendChannelMessage(msg.channelId, { embeds });

export const getChannelMessage = async (config: DiscordConfig, messageId?: string) => {
  if (!messageId) {
    return null;
  }
  const discordClient = await getDiscordClient();
  const channel = await discordClient.channels.fetch(config.channel);
  if (!isTextBasedChannel(channel)) {
    return null;
  }
  return channel.messages.fetch(messageId);
};
