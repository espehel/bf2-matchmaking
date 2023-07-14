import {
  createMessageReaction,
  editChannelMessage,
  getChannelMessages,
  removeChannelMessage,
} from './discord-rest';
import { MatchesJoined, MatchReaction } from '@bf2-matchmaking/types';
import { isMatchTitle } from './embed-utils';
import { APIEmbed, APIMessage } from 'discord-api-types/v10';
import { info } from '@bf2-matchmaking/logging';

const hasEmbeds = (message: APIMessage) => message.embeds.length > 0;
const someMatch = (embed: APIEmbed, matches: Array<MatchesJoined>) =>
  matches.some((match) => isMatchTitle(match, embed.title));
const notSomeMatch = (matches: Array<MatchesJoined>) => (embed: APIEmbed) =>
  !someMatch(embed, matches);

export const replaceEmbed = (
  message: APIMessage,
  embed: APIEmbed,
  matches: Array<MatchesJoined>
) => [...message.embeds.filter(notSomeMatch(matches)), embed];

export const getLastMatchMessage = (
  messages: Array<APIMessage>,
  matches: Array<MatchesJoined>
) =>
  messages.at(0)?.embeds.some((embed) => someMatch(embed, matches))
    ? messages.at(0)
    : undefined;

export const removeEmbeds = (
  messages: Array<APIMessage>,
  matches: Array<MatchesJoined>
) =>
  Promise.all(
    messages.filter(hasEmbeds).map(async (message) => {
      const embedsWithoutMatches = message.embeds.filter(notSomeMatch(matches));

      if (embedsWithoutMatches.length === 0) {
        info('removeEmbeds', `Removing channel message ${message.id}`);
        return await removeChannelMessage(message.channel_id, message.id);
      } else if (embedsWithoutMatches.length !== message.embeds.length) {
        info('removeEmbeds', `Editing channel message ${message.id}`);
        return await editChannelMessage(message.channel_id, message.id, {
          embeds: embedsWithoutMatches,
        });
      }
    })
  );

export const removeExistingMatchEmbeds = async (
  channelId: string,
  matches: Array<MatchesJoined>
) => {
  const { data: messages } = await getChannelMessages(channelId);
  if (messages) {
    await removeEmbeds(messages, matches);
  }
};

export const createSummonedReactions = (channelId: string, message: APIMessage) =>
  Promise.all([
    createMessageReaction(channelId, message.id, MatchReaction.READY),
    createMessageReaction(channelId, message.id, MatchReaction.CANCEL),
  ]);
