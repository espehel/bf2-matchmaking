import { error, info } from '@bf2-matchmaking/logging';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  getAssignedTeam,
  getCurrentTeam,
  getDraftStep,
  hasPlayer,
  isAssignedTeam,
  notHasPlayer,
} from '@bf2-matchmaking/utils';
import { getMatchEmbed, sendChannelMessage } from '@bf2-matchmaking/discord';
import {
  DiscordConfig,
  MatchConfigsRow,
  MatchesJoined,
  MatchStatus,
} from '@bf2-matchmaking/types';
import { APIUser, User } from 'discord.js';
import moment, { Duration } from 'moment';
import { getMatchCopyWithoutPlayer, getMatchCopyWithPlayer } from './utils';

export const getOrCreatePlayer = async ({
  id,
  username,
  discriminator,
  avatar,
}: User | APIUser) => {
  const { error, data } = await client().getPlayer(id);
  if (error) {
    info('getOrCreatePlayer', `Inserting Player <${username}> with id ${id}`);
    return client()
      .createPlayer({
        id,
        username: `${username}#${discriminator}`,
        full_name: username,
        avatar_url: avatar || '',
      })
      .then(verifySingleResult);
  }
  return data;
};

export const getOpenMatchesOrCreate = async (config: DiscordConfig) => {
  const { data } = await client().getOpenMatchesByChannelId(config.channel);
  return data?.length
    ? data
    : [await client().createMatchFromConfig(config).then(verifySingleResult)];
};

export const getMatchInfoByChannel = async (channel: string) => {
  const match = await client()
    .getStagingMatchesByChannel(channel)
    .single()
    .then(verifySingleResult);
  return getMatchEmbed(match);
};

export const addPlayer = async (user: User | APIUser, config: DiscordConfig) => {
  const matches = await getOpenMatchesOrCreate(config);
  const player = await getOrCreatePlayer(user);
  const expireAt = moment().add(config.player_expire, 'ms').toISOString();

  const matchesWithoutPlayer = matches.filter(notHasPlayer(player.id));
  if (!matchesWithoutPlayer.length) {
    return sendChannelMessage(config.channel, {
      content: 'Already joined all open matches in this channel.',
    });
  }

  const embeds = matchesWithoutPlayer
    .map(getMatchCopyWithPlayer(player))
    .map((match) => getMatchEmbed(match, `${player.full_name} joined`));
  sendChannelMessage(config.channel, { embeds });

  await Promise.all(
    matchesWithoutPlayer.map((match) =>
      client()
        .createMatchPlayer(match.id, player.id, 'bot', expireAt)
        .then(verifySingleResult)
    )
  )
    .then(() => {
      info(
        'addPlayer',
        `Added player ${player.full_name} to ${matchesWithoutPlayer.length} matches.`
      );
    })
    .catch((err) => {
      error('addPlayer', err);
      sendChannelMessage(config.channel, {
        content: 'Something went wrong while adding player.',
      });
    });
};

export const removePlayer = async (channelId: string, user: User | APIUser) => {
  const player = await getOrCreatePlayer(user);
  const stagingMatches = await client()
    .getStagingMatchesByChannel(channelId)
    .then(verifyResult);
  const matchesWithPlayer = stagingMatches
    .filter((m) => m.status !== MatchStatus.Drafting)
    .filter(hasPlayer(user.id));

  if (!matchesWithPlayer.length) {
    return sendChannelMessage(channelId, {
      content: 'You have joined no open matches in this channel.',
    });
  }

  const embeds = matchesWithPlayer
    .map(getMatchCopyWithoutPlayer(player.id))
    .map((match) => getMatchEmbed(match, `${player.full_name} left`));
  sendChannelMessage(channelId, { embeds });

  await Promise.all(
    matchesWithPlayer.map((match) =>
      client().deleteMatchPlayer(match.id, player.id).then(verifySingleResult)
    )
  )
    .then(() => {
      info(
        'removePlayer',
        `Removed player ${player.full_name} from ${matchesWithPlayer.length} matches.`
      );
    })
    .catch((err) => {
      error('removePlayer', err);
      sendChannelMessage(channelId, {
        content: 'Something went wrong while removing player.',
      });
    });
};

export const pickMatchPlayer = async (
  channelId: string,
  captainId: string,
  pickedPlayerId: string
): Promise<string | undefined> => {
  const match = await client()
    .getDraftingMatchByChannelId(channelId)
    .then(verifySingleResult);
  const { captain, team } = getDraftStep(match);

  if (!captain || !team) {
    return 'Can only pick during draft phase.';
  }

  if (captain.id !== captainId) {
    return `${captain.username} turn to pick`;
  }

  if (!isAssignedTeam(match, pickedPlayerId, null)) {
    return 'Player not in available player pool';
  }
  const { error: err } = await client().updateMatchPlayer(match.id, pickedPlayerId, {
    team,
  });

  if (err) {
    error('pickMatchPlayer', err.message);
    return 'Something went wrong while picking';
  }
  info('pickMatchPlayer', `Player ${pickedPlayerId} joined team ${team}.`);
};

export const getPlayerExpiration = async (channelId: string, user: User | APIUser) => {
  const { data } = await client().getOpenMatchesByChannelId(channelId);
  const expireAt = data?.at(0)?.teams.find((p) => p.player_id === user.id)?.expire_at;
  if (expireAt) {
    return `Your queue expires at <t:${moment().to(expireAt)}>`;
  }
  return 'No expire time found';
};

export const updateExpiration = async (
  channelId: string,
  player: User,
  matchConfig: MatchConfigsRow,
  duration: Duration
) => {
  const matches = await client().getStagingMatchesByChannel(channelId).then(verifyResult);
  const matchesWithPlayer = matches.filter(hasPlayer(player.id));

  if (duration.asMilliseconds() > matchConfig.player_expire) {
    const expireAt = moment().add(matchConfig.player_expire, 'ms');
    await client()
      .updateMatchPlayersForPlayerId(player.id, matchesWithPlayer, {
        expire_at: expireAt.toISOString(),
      })
      .then(verifySingleResult);
    return sendChannelMessage(channelId, {
      content: `Duration exceeds maximum, your queue expires at <t:${expireAt.unix()}>`,
    });
  }

  const expireAt = moment().add(duration);
  await client()
    .updateMatchPlayersForPlayerId(player.id, matchesWithPlayer, {
      expire_at: expireAt.toISOString(),
    })
    .then(verifySingleResult);
  return sendChannelMessage(channelId, {
    content: `New expire time set to <t:${expireAt.unix()}>`,
  });
};

export const changeMatchCaptain = async (
  match: MatchesJoined,
  author: User,
  captainId: string
) => {
  const removeCaptain = await client().updateMatchPlayer(match.id, captainId, {
    captain: false,
    team: null,
  });

  if (removeCaptain.error) {
    error('changeMatchCaptain', removeCaptain.error);
    return removeCaptain;
  }

  const addCaptain = await client().updateMatchPlayer(match.id, author.id, {
    captain: true,
    team: getAssignedTeam(match, captainId),
  });

  if (addCaptain.error) {
    error('changeMatchCaptain', addCaptain.error);
  }
  return addCaptain;
};
