import { Channel, Embed, TextChannel } from 'discord.js';

export const isTextBasedChannel = (channel: Channel | null): channel is TextChannel =>
  Boolean(channel && channel.isTextBased());

export const isPubobotMatchCheckIn = (embed?: Embed) =>
  embed?.title?.includes('is now on the check-in stage!') || false;
export const isPubobotMatchDrafting = (embed?: Embed) =>
  embed?.title?.includes('is now on the draft stage!') || false;
export const isPubobotMatchStarted = (embed?: Embed) =>
  embed?.title?.includes('has started!') || false;
