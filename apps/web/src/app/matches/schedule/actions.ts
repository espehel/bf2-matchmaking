'use server';
import { getChannelMessage } from '@bf2-matchmaking/discord';

export async function getDiscordMessage(channelId: string, messageId: string) {
  return getChannelMessage(channelId, messageId);
}
