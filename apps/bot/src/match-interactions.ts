import { error, info } from '@bf2-matchmaking/logging';
import { client, verifyResult, verifySingleResult } from '@bf2-matchmaking/supabase';
import {
  getDraftStep,
  hasPlayer,
  isAssignedTeam,
  notHasPlayer,
} from '@bf2-matchmaking/utils';
import { getMatchEmbed } from '@bf2-matchmaking/discord';
import { DiscordConfig } from '@bf2-matchmaking/types';
import { APIUser, User } from 'discord.js';
import moment from 'moment';
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
  const { data } = await client().getOpenMatchByChannelId(config.channel);
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
    return { content: 'Already joined all open matches in this channel.' };
  }

  await Promise.all(
    matchesWithoutPlayer.map((match) =>
      client()
        .createMatchPlayer(match.id, player.id, 'bot', expireAt)
        .then(verifySingleResult)
    )
  );

  const embeds = matchesWithoutPlayer
    .map(getMatchCopyWithPlayer(player))
    .map((match) => getMatchEmbed(match, `${player.full_name} joined`));
  return { embeds };
};

export const removePlayer = async (channelId: string, user: User | APIUser) => {
  const player = await getOrCreatePlayer(user);

  const matches = await client().getOpenMatchByChannelId(channelId).then(verifyResult);
  const matchesWithPlayer = matches.filter(hasPlayer(user.id));

  if (!matchesWithPlayer.length) {
    return { content: 'You have joined no open matches in this channel.' };
  }
  await Promise.all(
    matchesWithPlayer.map((match) =>
      client().deleteMatchPlayer(match.id, player.id).then(verifySingleResult)
    )
  );

  const embeds = matchesWithPlayer
    .map(getMatchCopyWithoutPlayer(player.id))
    .map((match) => getMatchEmbed(match, `${player.full_name} left`));

  return { embeds };
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
  const { data } = await client().getOpenMatchByChannelId(channelId);
  const expireAt = data?.at(0)?.teams.find((p) => p.player_id === user.id)?.expire_at;
  if (expireAt) {
    return { content: `Your queue expires ${moment().to(expireAt)}` };
  }
  return { content: 'No expire time found' };
};
