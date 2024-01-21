import { Channel, Embed, Message, MessageReaction, TextChannel } from 'discord.js';
import { logMessage } from '@bf2-matchmaking/logging';
import {
  createServerLocationPollField,
  createServerLocationPollResultField,
  getMatchField,
} from '@bf2-matchmaking/discord';
import {
  isNotNull,
  LocationEmoji,
  LocationPollResult,
  MatchesJoined,
} from '@bf2-matchmaking/types';
import { DateTime } from 'luxon';
import {
  getServerLocation,
  getServerLocationEmojis,
  getValidEmojis,
  isValidReaction,
} from '../services/location-service';
import { getKey } from '@bf2-matchmaking/utils/src/object-utils';
import { editLocationPollMessageWithResults } from '../services/message-service';

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
    await pollMessage.react(LocationEmoji.Existing);

    setTimeout(async () => {
      const results = pollMessage.reactions.cache
        .map(toResults(getValidEmojis()))
        .filter(isNotNull)
        .sort(compareMessageReactionResults(match));

      if (!results.length) {
        return reject('Unable to get results');
      }

      const location = getServerLocation(results[0][0]);
      if (!location) {
        return reject('Unable to get location');
      }

      await editLocationPollMessageWithResults(pollMessage, match, results);
      resolve(location);
    }, pollEndTime.diffNow('milliseconds').milliseconds);
  });
}
function toResults(validEmojis: Array<LocationEmoji>) {
  return (reaction: MessageReaction): LocationPollResult | null => {
    if (reaction.emoji.name && validEmojis.some((k) => k === reaction.emoji.name)) {
      return [reaction.emoji.name, Array.from(reaction.users.cache.keys())];
    } else {
      return null;
    }
  };
}
function compareMessageReactionResults(match: MatchesJoined) {
  const matchPlayers = match.players.map((player) => player.id);
  return ([, votesA]: LocationPollResult, [, votesB]: LocationPollResult) =>
    getValidUsersCount(votesB, matchPlayers) - getValidUsersCount(votesA, matchPlayers);
}

function getValidUsersCount(users: Array<string>, matchPlayers: Array<string>) {
  return users.filter((user) => matchPlayers.includes(user)).length;
}
