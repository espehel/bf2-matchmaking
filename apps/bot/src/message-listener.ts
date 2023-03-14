import { error, info } from '@bf2-matchmaking/logging';
import {
  addPlayer,
  getPlayerExpiration,
  pickMatchPlayer,
  removePlayer,
} from './match-interactions';
import { client, verifyResult } from '@bf2-matchmaking/supabase';
import { getDiscordClient } from './client';
import {
  getMatchEmbed,
  removeExistingMatchEmbeds,
  sendChannelMessage,
} from '@bf2-matchmaking/discord';
import { Message } from 'discord.js';
import { DiscordChannelsJoined } from '@bf2-matchmaking/types';
import { hasSummonEmbed } from './utils';
import { startReactionListener } from './reaction-listener';

export const initMessageListener = async () => {
  const channels = await client().getChannels().then(verifyResult);
  const channelMap = new Map(channels.map((channel) => [channel.channel_id, channel]));
  const discordClient = await getDiscordClient();
  discordClient.on('messageCreate', async (msg) => {
    if (!channelMap.has(msg.channel.id)) {
      return;
    }

    if (hasSummonEmbed(msg)) {
      startReactionListener(msg);
    }

    try {
      const result = await parseMessage(msg, channelMap.get(msg.channel.id)!);
      if (result) {
        await sendChannelMessage(msg.channel.id, result);
      }
    } catch (e) {
      if (e instanceof Error) {
        error('discord-gateway', e.message);
      } else if (typeof e === 'string') {
        error('discord-gateway', e);
      } else {
        error('discord-gateway', JSON.stringify(e));
      }
    }
  });
};

const parseMessage = (msg: Message, channel: DiscordChannelsJoined) => {
  switch (msg.content.split(' ')[0]) {
    case '!who':
      return onWho(msg);
    case '--':
      return onLeave(msg);
    case '++':
      return onJoin(msg, channel);
    case '!pick':
      return onPick(msg);
    case '!expire':
      return onExpire(msg, channel);
    case '!help':
      return { content: 'Commands: `!who`, `--`, `++`, `!pick <@user>`, !expire' };
    default:
      return Promise.resolve();
  }
};

const onWho = async (msg: Message) => {
  info(
    'discord-gateway',
    `Received command <${msg.content}> for channel <${msg.channel.id}>`
  );
  const { data: matches, error: err } = await client().getStagingMatchesByChannelId(
    msg.channel.id
  );

  if (err) {
    error('onWho', err);
    return { content: 'Failed to get match statuses' };
  }

  await removeExistingMatchEmbeds(msg.channel.id, matches);
  const embeds = matches.map((match) => getMatchEmbed(match));
  return { embeds };
};

const onLeave = async (msg: Message) => {
  info(
    'discord-gateway',
    `Received command <${msg.content}> for channel <${msg.channel.id}>`
  );
  return removePlayer(msg.channel.id, msg.author);
};

const onJoin = async (msg: Message, channel: DiscordChannelsJoined) => {
  info(
    'discord-gateway',
    `Received command <${msg.content}> for channel <${msg.channel.id}>`
  );
  return addPlayer(
    msg.channel.id,
    msg.author,
    channel.match_config?.player_expire || null
  );
};
const onPick = async (msg: Message) => {
  info(
    'discord-gateway',
    `Received command <${msg.content}> for channel <${msg.channel.id}>`
  );
  const playerId = msg.mentions.users.first()?.id || msg.content.split(' ')[1];
  if (!playerId) {
    return { content: 'No player mentioned' };
  }
  const feedbackMessage = await pickMatchPlayer(msg.channel.id, msg.author.id, playerId);
  return feedbackMessage ? { content: feedbackMessage } : null;
};

const onExpire = async (msg: Message, channel: DiscordChannelsJoined) => {
  info(
    'discord-gateway',
    `Received command <${msg.content}> for channel <${msg.channel.id}>`
  );
  return getPlayerExpiration(msg.channel.id, msg.author);
};
