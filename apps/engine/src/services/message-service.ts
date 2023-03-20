import { DiscordMatch, MatchPlayersRow } from '@bf2-matchmaking/types';
import {
  sendDirectMessage,
  createMessageReaction,
  replaceChannelMessage,
  removeExistingMatchEmbeds,
  sendChannelMessage,
} from '@bf2-matchmaking/discord';
import { getMatchEmbed } from '@bf2-matchmaking/discord';
import { client, verifySingleResult } from '@bf2-matchmaking/supabase';

export const sendMatchJoinMessage = async (
  { player_id, source }: MatchPlayersRow,
  match: DiscordMatch
) => {
  const player = match.players.find((p) => p.id === player_id);
  await replaceChannelMessage(
    match,
    getMatchEmbed(match, `${player?.full_name || 'Player'} joined`)
  );
};

export const sendMatchLeaveMessage = async (
  { player_id, source }: Partial<MatchPlayersRow>,
  match: DiscordMatch
) => {
  const player = await client().getPlayer(player_id).then(verifySingleResult);
  await replaceChannelMessage(match, getMatchEmbed(match, `${player.full_name} left`));
};

export const sendMatchSummoningMessage = async (match: DiscordMatch) => {
  const playerMentions = match.teams.map((player) => `<@${player.player_id}>`).join(', ');

  await removeExistingMatchEmbeds(match.config.channel, [match]);
  const { data: message } = await sendChannelMessage(match.config.channel, {
    embeds: [getMatchEmbed(match, `Ready up! ${playerMentions}`)],
  });

  if (message) {
    await createMessageReaction(match.config.channel, message.id, '✅');
  }
};

export const sendMatchInfoMessage = async (match: DiscordMatch) => {
  const embed = getMatchEmbed(match);
  return await replaceChannelMessage(match, embed);
};

export const sendSummoningDM = (match: DiscordMatch) => {
  const content =
    `Check in has started for Match ${match.id}, you can check in at following places:`
      .concat(`\n  - Web: https://bf2-matchmaking.netlify.app/matches/${match.id}`)
      .concat(`\n  - React to discord message: <#${match.config.channel}>`);
  // TODO: Create staging channel for each match
  /*.concat(
        match.config.channel
          ? `\n  - Join staging voice channel: <#${match.config.channel}>.`
          : ''
      );*/
  return Promise.allSettled(
    match.players.map((player) => sendDirectMessage(player.id, { content }))
  );
};
