import { Channel, Embed, TextChannel } from 'discord.js';
import { MatchConfigsRow } from '@bf2-matchmaking/types';
import { getDiscordClient } from './client';
import { DEMO_CHANNEL_ID } from '@bf2-matchmaking/discord';

export const isTextBasedChannel = (channel: Channel | null): channel is TextChannel =>
  Boolean(channel && channel.isTextBased());

export const isPubobotMatchCheckIn = (embed?: Embed) =>
  embed?.title?.includes('is now on the check-in stage!') || false;
export const isPubobotMatchDrafting = (embed?: Embed) =>
  embed?.title?.includes('is now on the draft stage!') || false;
export const isPubobotMatchStarted = (embed?: Embed) =>
  embed?.title?.includes('has started!') || false;

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
