import { error } from '@bf2-matchmaking/logging';
import {
  addPlayer,
  getPlayerExpiration,
  pickMatchPlayer,
  removePlayer,
} from './match-interactions';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  getMatchEmbed,
  removeExistingMatchEmbeds,
  sendChannelMessage,
} from '@bf2-matchmaking/discord';
import { Message } from 'discord.js';
import { DiscordConfig, MatchConfigsRow, MatchStatus } from '@bf2-matchmaking/types';
import { createHelpContent, parseDurationArg } from './command-utils';
import moment from 'moment/moment';
import { hasPlayer } from '@bf2-matchmaking/utils';

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

export const onExpire = async (msg: Message, matchConfig: MatchConfigsRow) => {
  const durationArg = msg.content.split(' ')[1];

  if (!durationArg) {
    const reply = await getPlayerExpiration(msg.channelId, msg.author);
    return sendChannelMessage(msg.channelId, reply);
  }

  const { duration, error } = parseDurationArg(durationArg);
  if (error) {
    return sendChannelMessage(msg.channelId, { content: error });
  }

  const matches = await client()
    .getStagingMatchesByChannel(msg.channelId)
    .then(verifyResult);
  const matchesWithPlayer = matches.filter(hasPlayer(msg.author.id));

  if (duration!.asMilliseconds() > matchConfig.player_expire) {
    const expireAt = moment().add(matchConfig.player_expire, 'ms');
    await client()
      .updateMatchPlayersForPlayerId(msg.author.id, matchesWithPlayer, {
        expire_at: expireAt.toISOString(),
      })
      .then(verifySingleResult);
    return sendChannelMessage(msg.channelId, {
      content: `Duration exceeds maximum, new expire time set to expire <t:${expireAt.unix()}:R>`,
    });
  }

  const expireAt = moment().add(duration);
  await client()
    .updateMatchPlayersForPlayerId(msg.author.id, matchesWithPlayer, {
      expire_at: expireAt.toISOString(),
    })
    .then(verifySingleResult);
  return sendChannelMessage(msg.channelId, {
    content: `New expire time set to expire <t:${expireAt.unix()}:R>`,
  });
};
