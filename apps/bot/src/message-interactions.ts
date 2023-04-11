import { error } from '@bf2-matchmaking/logging';
import {
  addPlayer,
  changeMatchCaptain,
  getPlayerExpiration,
  pickMatchPlayer,
  removePlayer,
  swapPlayer,
  updateExpiration,
} from './match-interactions';
import { client } from '@bf2-matchmaking/supabase';
import { getMatchEmbed, removeExistingMatchEmbeds } from '@bf2-matchmaking/discord';
import { Message } from 'discord.js';
import { DiscordConfig, MatchConfigsRow } from '@bf2-matchmaking/types';
import { createHelpContent, parseDurationArg } from './command-utils';
import { reply, replyEmbeds } from './message-utils';
import { hasPlayer, notHasPlayer } from '@bf2-matchmaking/utils';

export const onHelp = (msg: Message) => {
  return reply(msg, createHelpContent());
};

export const onWho = async (msg: Message) => {
  const { data: matches, error: err } = await client().getStagingMatchesByChannel(
    msg.channel.id
  );

  if (err) {
    error('onWho', err);
    return reply(msg, 'Failed to get match statuses');
  }

  await removeExistingMatchEmbeds(msg.channel.id, matches);
  const embeds = matches.map((match) => getMatchEmbed(match));
  if (embeds.length) {
    return replyEmbeds(msg, embeds);
  }

  return reply(msg, 'No active matches in channel.');
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
    return reply(msg, 'No player mentioned');
  }

  const feedbackMessage = await pickMatchPlayer(msg.channel.id, msg.author.id, playerId);
  return feedbackMessage ? reply(msg, feedbackMessage) : null;
};

export const onExpire = async (msg: Message, matchConfig: MatchConfigsRow) => {
  const durationArg = msg.content.split(' ')[1];

  if (!durationArg) {
    const expiration = await getPlayerExpiration(msg.channelId, msg.author);
    return reply(msg, expiration);
  }

  const { duration, error } = parseDurationArg(durationArg);
  if (error) {
    return reply(msg, error);
  }

  return updateExpiration(msg.channelId, msg.author, matchConfig, duration!);
};

export const onCapfor = async (msg: Message) => {
  const captainId = msg.mentions.users.first()?.id || msg.content.split(' ')[1];

  if (!captainId) {
    return reply(msg, 'No captain mentioned');
  }

  const { data: matches } = await client().getDraftingMatchesByChannelId(msg.channelId);

  const match = matches?.find((m) =>
    m.teams.some((mp) => mp.player_id === captainId && mp.captain)
  );

  if (!match) {
    return reply(msg, 'Mentioned player is not captain in any drafting matches');
  }

  if (notHasPlayer(msg.author.id)(match)) {
    return reply(msg, 'You must be part of same match as captain to sub');
  }

  const { error } = await changeMatchCaptain(match, msg.author, captainId);
  if (error) {
    return reply(msg, 'Failed to change team captain');
  }
};

export const onSubFor = async (msg: Message) => {
  const playerId = msg.mentions.users.first()?.id || msg.content.split(' ')[1];

  if (!playerId) {
    return reply(msg, 'No player mentioned');
  }

  const { data: matches } = await client().getDraftingMatchesByChannelId(msg.channelId);

  const match = matches?.find((m) => m.teams.some((mp) => mp.player_id === playerId));
  const prevPlayer = match?.teams.find((mp) => mp.player_id === playerId);

  if (!prevPlayer || !match) {
    return reply(msg, 'Mentioned player is not part of any drafting matches');
  }

  if (hasPlayer(msg.author.id)(match)) {
    return reply(msg, 'You can not be part of same match as player you are subbing for');
  }

  const { error } = await swapPlayer(match, msg.author, prevPlayer);
  if (error) {
    return reply(msg, 'Failed to sub for player');
  }
};
