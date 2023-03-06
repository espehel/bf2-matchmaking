import { DiscordMatch, MatchesJoined, MatchPlayersRow } from '@bf2-matchmaking/types';
import {
  sendChannelMessage,
  removeExistingMatchEmbeds,
  sendDirectMessage,
  createMessageReaction,
} from '@bf2-matchmaking/discord';
import { getMatchEmbed } from '@bf2-matchmaking/discord';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';
import { RESTPostAPIChannelMessageJSONBody } from 'discord-api-types/v10';
import { info } from '@bf2-matchmaking/logging';

export const sendMatchJoinMessage = async (
  { player_id, source }: MatchPlayersRow,
  match: DiscordMatch
) => {
  const player = match.players.find((p) => p.id === player_id);
  await replaceChannelMessage(match, {
    embeds: [getMatchEmbed(match, `${player?.full_name || 'Player'} joined`)],
  });
};

export const sendMatchLeaveMessage = async (
  { player_id, source }: Partial<MatchPlayersRow>,
  match: DiscordMatch
) => {
  const player = await client().getPlayer(player_id).then(verifySingleResult);
  await replaceChannelMessage(match, {
    embeds: [getMatchEmbed(match, `${player.full_name} left`)],
  });
};

export const sendMatchSummoningMessage = async (match: DiscordMatch) => {
  const playerMentions = match.teams.map((player) => `<@${player.player_id}>`).join(', ');
  const { data: message } = await replaceChannelMessage(match, {
    embeds: [getMatchEmbed(match, `Ready up! ${playerMentions}`)],
  });
  if (message) {
    await createMessageReaction(match.channel.channel_id, message.id, '✅');
  }
};

export const sendMatchInfoMessage = async (match: DiscordMatch) => {
  const embed = getMatchEmbed(match);
  await replaceChannelMessage(match, {
    embeds: [embed],
  });
};

const replaceChannelMessage = async (
  match: DiscordMatch,
  body: RESTPostAPIChannelMessageJSONBody
) => {
  info('replaceChannelMessage', `Replacing match message for match ${match.id}`);
  await removeExistingMatchEmbeds(match.channel.channel_id, [match]);
  return await sendChannelMessage(match.channel.channel_id, body);
};

export const sendSummoningDM = (match: MatchesJoined) => {
  const content = `Check in has started for Match ${match.id}. Some more info will come here...`;
  return Promise.allSettled(
    match.players.map((player) => sendDirectMessage(player.id, { content }))
  );
};
