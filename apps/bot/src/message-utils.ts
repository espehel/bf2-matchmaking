import { sendChannelMessage } from '@bf2-matchmaking/discord';
import { APIEmbed, Message } from 'discord.js';

export const reply = async (msg: Message, content: string) =>
  sendChannelMessage(msg.channelId, { content });
export const replyEmbeds = async (msg: Message, embeds: Array<APIEmbed>) =>
  sendChannelMessage(msg.channelId, { embeds });
