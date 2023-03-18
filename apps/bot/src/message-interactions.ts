import { error, info } from '@bf2-matchmaking/logging';
import {
  addPlayer,
  getPlayerExpiration,
  pickMatchPlayer,
  removePlayer,
} from './match-interactions';
import { client } from '@bf2-matchmaking/supabase';
import { getMatchEmbed, removeExistingMatchEmbeds } from '@bf2-matchmaking/discord';
import { Message } from 'discord.js';
import { MatchConfigsRow } from '@bf2-matchmaking/types';
import { createHelpContent } from './command-utils';

export const onHelp = () =>
  Promise.resolve({
    content: createHelpContent(),
  });

export const onWho = async (msg: Message) => {
  info(
    'discord-gateway',
    `Received command <${msg.content}> for channel <${msg.channel.id}>`
  );
  const { data: matches, error: err } = await client().getStagingMatchesByChannel(
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

export const onLeave = async (msg: Message) => {
  info(
    'discord-gateway',
    `Received command <${msg.content}> for channel <${msg.channel.id}>`
  );
  return removePlayer(msg.channel.id, msg.author);
};

export const onJoin = async (msg: Message, matchConfig: MatchConfigsRow | null) => {
  info(
    'discord-gateway',
    `Received command <${msg.content}> for channel <${msg.channel.id}>`
  );
  return addPlayer(msg.channel.id, msg.author, matchConfig?.player_expire || null);
};
export const onPick = async (msg: Message) => {
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

export const onExpire = async (msg: Message, matchConfig: MatchConfigsRow | null) => {
  info(
    'discord-gateway',
    `Received command <${msg.content}> for channel <${msg.channel.id}>`
  );
  return getPlayerExpiration(msg.channel.id, msg.author);
};
