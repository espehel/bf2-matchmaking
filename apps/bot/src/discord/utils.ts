import { Channel, Embed, Message, MessageReaction, TextChannel } from 'discord.js';
import { logMessage } from '@bf2-matchmaking/logging';
import {
  createServerLocationPollField,
  createServerLocationPollResultField,
  getMatchField,
} from '@bf2-matchmaking/discord';
import { LocationEmoji, MatchesJoined } from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import {
  getServerLocation,
  getServerLocationEmojis,
  isValidReaction,
} from '../services/location-service';
import { getKey } from '@bf2-matchmaking/utils/src/object-utils';

export const isTextBasedChannel = (channel: Channel | null): channel is TextChannel =>
  Boolean(channel && channel.isTextBased());

export const isPubobotMatchCheckIn = (embed?: Embed) =>
  embed?.title?.includes('is now on the check-in stage!') || false;
export const isPubobotMatchDrafting = (embed?: Embed) =>
  embed?.title?.includes('is now on the draft stage!') || false;
export const isPubobotMatchStarted = (embed?: Embed) =>
  embed?.title?.includes('has started!') || false;
export async function startTopLocationPoll(
  match: MatchesJoined,
  message: Message
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    const pollEndTime = DateTime.now().plus({ seconds: 30 });

    const pollMessage = await message.channel.send({
      embeds: [
        { fields: [createServerLocationPollField(pollEndTime), getMatchField(match)] },
      ],
    });
    logMessage(`Channel ${message.channel.id}: Poll created for Match ${match.id}`, {
      match,
    });

    for (const emoji of getServerLocationEmojis()) {
      await pollMessage.react(emoji);
    }

    setTimeout(async () => {
      const topEmoji = pollMessage.reactions.cache
        .filter(isValidReaction)
        .sort(compareMessageReactionCount(match))
        .at(0);

      const location = getServerLocation(topEmoji?.emoji.name);
      if (!location) {
        return reject('Unable to get location');
      }

      const locationName = getKey(LocationEmoji, topEmoji?.emoji.name);
      if (locationName) {
        await pollMessage.edit({
          embeds: [
            {
              fields: [
                createServerLocationPollResultField(locationName),
                getMatchField(match),
              ],
            },
          ],
        });
      }
      logMessage(
        `Channel ${pollMessage.channel.id}: Poll updated with result for Match ${match.id}`,
        {
          match,
          locationName,
          reactions: pollMessage.reactions.cache,
        }
      );

      resolve(location);
    }, pollEndTime.diffNow('milliseconds').milliseconds);
  });
}
function compareMessageReactionCount(match: MatchesJoined) {
  const matchPlayers = match.players.map((player) => player.id);
  return (firstValue: MessageReaction, secondValue: MessageReaction) =>
    getValidUsersCount(secondValue, matchPlayers) -
    getValidUsersCount(firstValue, matchPlayers);
}

function getValidUsersCount(reaction: MessageReaction, matchPlayers: Array<string>) {
  return Array.from(reaction.users.cache.keys()).filter((user) =>
    matchPlayers.includes(user)
  ).length;
}
