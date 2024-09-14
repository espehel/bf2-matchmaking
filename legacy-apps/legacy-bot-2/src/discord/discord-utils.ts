import { Channel, Message, TextChannel } from 'discord.js';
import { MatchConfigsRow } from '@bf2-matchmaking/types';
import { getDiscordClient } from './client';

export const isTextBasedChannel = (channel: Channel | null): channel is TextChannel =>
  Boolean(channel && channel.isTextBased());

export const isPubobotMatchCheckIn = (message: Message) =>
  message.embeds[0]?.title?.includes('is now on the check-in stage!') || false;
export const isPubobotMatchDrafting = (message: Message) =>
  message.embeds[0]?.title?.includes('is now on the draft stage!') || false;
export const isPubobotMatchStarted = (message: Message) =>
  message.embeds[0]?.title?.includes('has started!') || false;

export async function getTextChannelFromConfig(config: MatchConfigsRow) {
  if (!config.channel) {
    throw new Error('Missing channel in config');
  }
  const client = await getDiscordClient();
  const channel = await client.channels.fetch(config.channel);
  if (!channel) {
    throw new Error('Failed to fetch channel');
  }
  if (!isTextBasedChannel(channel)) {
    throw new Error('Channel is not a text channel');
  }
  return channel;
}
