import { DiscordMatch, MatchPlayersRow } from '@bf2-matchmaking/types';
import { sendChannelMessage, removeExistingMatchEmbeds } from '@bf2-matchmaking/discord';
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
  removeExistingMatchEmbeds(match.channel.channel_id, [match]);
  await sendChannelMessage(match.channel.channel_id, body);
};
