import {
  editChannelMessage,
  getChannelMessages,
  removeChannelMessage,
  sendChannelMessage,
} from './discord-rest';
import { DiscordMatch, MatchesJoined } from '@bf2-matchmaking/types';
import { isMatchTitle } from './embed-utils';
import { APIEmbed, APIMessage } from 'discord-api-types/v10';
import { info } from '@bf2-matchmaking/logging';

const hasEmbeds = (message: APIMessage) => message.embeds.length > 0;
const someMatch = (embed: APIEmbed, matches: Array<MatchesJoined>) =>
  matches.some((match) => isMatchTitle(match, embed.title));
const notSomeMatch = (matches: Array<MatchesJoined>) => (embed: APIEmbed) =>
  !someMatch(embed, matches);

export const removeExistingMatchEmbeds = async (
  channelId: string,
  matches: Array<MatchesJoined>
) => {
  const { data: messages } = await getChannelMessages(channelId);
  if (messages) {
    messages.filter(hasEmbeds).forEach((message) => {
      const embedsWithoutExistingMatches = message.embeds.filter(notSomeMatch(matches));

      if (embedsWithoutExistingMatches.length === 0) {
        info('removeExistingMatchEmbeds', `Removing channel message ${message.id}`);
        removeChannelMessage(message.channel_id, message.id);
      } else if (embedsWithoutExistingMatches.length !== message.embeds.length) {
        info('removeExistingMatchEmbeds', `Editing channel message ${message.id}`);
        editChannelMessage(message.channel_id, message.id, {
          embeds: embedsWithoutExistingMatches,
        });
      }
    });
  }
};

export const replaceChannelMessage = async (match: DiscordMatch, embed: APIEmbed) => {
  info('replaceChannelMessage', `Replacing match message for match ${match.id}`);
  const { data: messages } = await getChannelMessages(match.config.channel);
  const lastMessage = messages?.at(0);

  if (
    lastMessage &&
    hasEmbeds(lastMessage) &&
    lastMessage.embeds.some((embed) => isMatchTitle(match, embed.title))
  ) {
    return editChannelMessage(lastMessage.channel_id, lastMessage.id, {
      embeds: [...lastMessage.embeds.filter(notSomeMatch([match])), embed],
    });
  }

  await removeExistingMatchEmbeds(match.config.channel, [match]);
  return await sendChannelMessage(match.config.channel, { embeds: [embed] });
};
