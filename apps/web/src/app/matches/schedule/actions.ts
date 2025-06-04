'use server';
import { getChannelMessage } from '@bf2-matchmaking/discord';
import { parseError } from '@bf2-matchmaking/utils';

export async function getDiscordMessage(channelId: string, messageId: string) {
  const { data, error } = await getChannelMessage(channelId, messageId);
  if (error) {
    throw new Error(parseError(error));
  }
  if (!data) {
    throw new Error('Message not found');
  }
  return data;
}
