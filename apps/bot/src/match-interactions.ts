import { error, info } from '@bf2-matchmaking/logging';
import { client, verifySingleResult, verifyResult } from '@bf2-matchmaking/supabase';
import { getDraftStep, isAssignedTeam } from '@bf2-matchmaking/utils';
import { getMatchEmbed } from '@bf2-matchmaking/discord';
import { MatchStatus } from '@bf2-matchmaking/types';
import { APIUser, User } from 'discord.js';

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

export const getMatchInfoByChannel = async (channelId: string) => {
  const match = await client()
    .getStagingMatchesByChannelId(channelId)
    .single()
    .then(verifySingleResult);
  return getMatchEmbed(match);
};

export const addPlayer = async (channelId: string, user: User | APIUser) => {
  const { data: match } = await client().getOpenMatchByChannelId(channelId);
  const player = await getOrCreatePlayer(user);

  if (!match) {
    return { content: 'No open match currently in channel' };
  }

  await client().createMatchPlayer(match.id, player.id, 'bot').then(verifySingleResult);
  return { embeds: [getMatchEmbed(match, `${player.full_name} joined`)] };
};

export const removePlayer = async (channelId: string, user: User | APIUser) => {
  const match = await client()
    .getOpenMatchByChannelId(channelId)
    .then(verifySingleResult);
  const player = await getOrCreatePlayer(user);

  if (match.status !== MatchStatus.Open) {
    return { content: 'Can only leave Open matches.' };
  }

  await client().deleteMatchPlayer(match.id, player.id).then(verifySingleResult);
  return { embeds: [getMatchEmbed(match, `${player.full_name} left`)] };
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
};
