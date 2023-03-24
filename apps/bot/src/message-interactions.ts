import { error, info } from '@bf2-matchmaking/logging';
import {
  addPlayer,
  getPlayerExpiration,
  pickMatchPlayer,
  removePlayer,
} from './match-interactions';
import { client } from '@bf2-matchmaking/supabase';
import {
  getMatchEmbed,
  removeExistingMatchEmbeds,
  sendChannelMessage,
} from '@bf2-matchmaking/discord';
import { Message } from 'discord.js';
import { DiscordConfig, MatchConfigsRow } from '@bf2-matchmaking/types';
import { createHelpContent } from './command-utils';

export const onHelp = (msg: Message) => {
  return sendChannelMessage(msg.channelId, {
    content: createHelpContent(),
  });
};

export const onWho = async (msg: Message) => {
  const { data: matches, error: err } = await client().getStagingMatchesByChannel(
    msg.channel.id
  );

  if (err) {
    error('onWho', err);
    return sendChannelMessage(msg.channelId, {
      content: 'Failed to get match statuses',
    });
  }

  await removeExistingMatchEmbeds(msg.channel.id, matches);
  const embeds = matches.map((match) => getMatchEmbed(match));
  if (embeds.length) {
    return sendChannelMessage(msg.channelId, { embeds });
  }

  return sendChannelMessage(msg.channelId, {
    content: 'No active matches in channel.',
  });
};

export const onLeave = (msg: Message) => {
  return removePlayer(msg.channel.id, msg.author);
};

export const onJoin = async (msg: Message, matchConfig: DiscordConfig) => {
  return addPlayer(msg.author, matchConfig);
};
export const onPick = async (msg: Message) => {
  const playerId = msg.mentions.users.first()?.id || msg.content.split(' ')[1];
  if (!playerId) {
    return sendChannelMessage(msg.channelId, {
      content: 'No player mentioned',
    });
  }
  const feedbackMessage = await pickMatchPlayer(msg.channel.id, msg.author.id, playerId);
  return feedbackMessage
    ? sendChannelMessage(msg.channelId, {
        content: feedbackMessage,
      })
    : null;
};

export const onExpire = async (msg: Message, matchConfig: MatchConfigsRow | null) => {
  const reply = await getPlayerExpiration(msg.channel.id, msg.author);
  return sendChannelMessage(msg.channelId, reply);
};
