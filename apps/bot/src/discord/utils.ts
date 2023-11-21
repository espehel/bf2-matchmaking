import { Channel, Embed, Message, MessageCreateOptions, TextChannel } from 'discord.js';
import { info, logCreateChannelMessage, logErrorMessage } from '@bf2-matchmaking/logging';
import { getDiscordClient } from './client';
import { assertObj } from '@bf2-matchmaking/utils';
import { TEST_CHANNEL_ID } from '@bf2-matchmaking/discord';

export const isTextBasedChannel = (channel: Channel | null): channel is TextChannel =>
  Boolean(channel && channel.isTextBased());

export const isPubobotMatchDrafting = (embed?: Embed) =>
  embed?.title?.includes('is now on the draft stage!') || false;
export const isPubobotMatchStarted = (embed?: Embed) =>
  embed?.title?.includes('has started!') || false;

export async function replyMessage(message: Message, content: MessageCreateOptions) {
  if (!isTextBasedChannel(message.channel)) {
    info('replyMessage', 'Message did not come from text based channel');
    return null;
  }
  try {
    const replyMessage = await message.channel.send(content);
    logCreateChannelMessage(
      message.channel.id,
      replyMessage.id,
      replyMessage.embeds[0].description,
      replyMessage.embeds
    );
    return replyMessage;
  } catch (e) {
    logErrorMessage('Failed to reply to message', e, { message, content });
    return null;
  }
}

export async function getTestChannel() {
  const client = await getDiscordClient();
  const channel = await client.channels.fetch(TEST_CHANNEL_ID);
  if (!isTextBasedChannel(channel)) {
    throw new Error('Test channel not found');
  }
  return channel;
}
