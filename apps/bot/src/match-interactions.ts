import { APIUser } from 'discord-api-types/v10';
import { error, info } from '@bf2-matchmaking/logging';
import { client, verifySingleResult, verifyResult } from '@bf2-matchmaking/supabase';
import { findCaptain, getCurrentTeam, isAssignedTeam } from '@bf2-matchmaking/utils';
import { getMatchEmbed } from '@bf2-matchmaking/discord';
import { MatchStatus } from '@bf2-matchmaking/types';

export const getOrCreatePlayer = async ({
  id,
  username,
  discriminator,
  avatar,
}: APIUser) => {
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
    .getStagingMatchByChannelId(channelId)
    .then(verifySingleResult);
  return {
    embed: getMatchEmbed(match),
  };
};

export const addPlayer = async (channelId: string, user: APIUser) => {
  const match = await client()
    .getOpenMatchByChannelId(channelId)
    .then(verifySingleResult);
  const player = await getOrCreatePlayer(user);
  if (match.status === MatchStatus.Open) {
    await client().createMatchPlayer(match.id, player.id).then(verifyResult);
  }
};

export const removePlayer = async (channelId: string, user: APIUser) => {
  const match = await client()
    .getOpenMatchByChannelId(channelId)
    .then(verifySingleResult);
  const player = await getOrCreatePlayer(user);
  if (match.status === MatchStatus.Open) {
    await client().deleteMatchPlayer(match.id, player.id).then(verifyResult);
  }
};

export const pickMatchPlayer = async (
  channelId: string,
  captainId: string,
  pickedPlayerId: string
): Promise<string | undefined> => {
  const match = await client()
    .getDraftingMatchByChannelId(channelId)
    .then(verifySingleResult);
  const currentTeam = getCurrentTeam(match);
  const captain = findCaptain(captainId, match.teams);

  if (!captain) {
    return 'Only captains can pick';
  }

  if (captain.team !== currentTeam) {
    return 'Not your turn to pick';
  }
  if (!isAssignedTeam(match, pickedPlayerId, null)) {
    return 'Player not in available player pool';
  }
  const { error: err } = await client().updateMatchPlayer(match.id, pickedPlayerId, {
    team: currentTeam,
  });

  if (err) {
    error('pickMatchPlayer', err.message);
    return 'Something went wrong while picking';
  }
};
