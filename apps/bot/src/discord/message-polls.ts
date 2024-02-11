import {
  isNotNull,
  LocationEmoji,
  PollResult,
  MatchesJoined,
  PollEmoji,
  MatchPlayersRow,
} from '@bf2-matchmaking/types';
import { Message, MessageReaction, TextBasedChannel, TextChannel } from 'discord.js';
import { DateTime } from 'luxon';
import {
  buildDraftPollEmbed,
  createServerLocationPollField,
  getMatchField,
} from '@bf2-matchmaking/discord';
import { logMessage } from '@bf2-matchmaking/logging';
import {
  getServerLocation,
  getServerLocationEmojis,
  getValidEmojis,
} from '../services/location-service';
import {
  editLocationPollMessageWithResults,
  sendMessage,
} from '../services/message-service';
import { buildMixTeams, createDraftList } from '../services/draft-utils';
import { PubobotMatch } from '../services/PubobotMatch';
import { wait } from '@bf2-matchmaking/utils/src/async-actions';

export async function startDraftPoll(
  puboMatch: PubobotMatch,
  teams: Array<MatchPlayersRow>,
  channel: TextChannel
) {
  const match = puboMatch.match;
  return new Promise<PollEmoji>(async (resolve, reject) => {
    const pollEndTime = DateTime.now().plus({ seconds: 30 });

    const pollMessage = await sendMessage(
      channel,
      {
        embeds: [buildDraftPollEmbed(match, teams)],
      },
      { teams, match }
    );

    if (!pollMessage) {
      return reject('Failed to send poll message');
    }

    await Promise.all([
      pollMessage.react(PollEmoji.ACCEPT),
      pollMessage.react(PollEmoji.REJECT),
    ]);

    logMessage(`Channel ${channel.id}: Poll created for Match ${match.id}`, {
      match,
      teams,
    });

    setTimeout(async () => {
      const acceptResult = pollMessage.reactions.cache
        .map(toResults(Object.values(PollEmoji)))
        .filter(isNotNull)
        .find(([reaction]) => reaction === PollEmoji.ACCEPT);

      if (!acceptResult) {
        return reject('Unable to get acceptResult');
      }
      const [, voters] = acceptResult;

      const pollResult =
        voters.length > match.config.size / 2 ? PollEmoji.ACCEPT : PollEmoji.REJECT;

      logMessage(`Match ${puboMatch.match.id}: Draft poll ended`, {
        PubobotMatch: puboMatch.id,
        match: puboMatch.match,
        acceptResult,
        pollResult,
      });

      resolve(pollResult);
    }, pollEndTime.diffNow('milliseconds').milliseconds);
  });
}

export function handleDraftPollResult(
  puboMatch: PubobotMatch,
  teams: Array<MatchPlayersRow>,
  channel: TextChannel
) {
  return async (result: PollEmoji) => {
    if (result === PollEmoji.ACCEPT || result === PollEmoji.REJECT) {
      const draftList = createDraftList(teams);

      logMessage(`Match ${puboMatch.match.id}: Executing suggested draft`, {
        PubobotMatch: puboMatch.id,
        match: puboMatch.match,
        draftList,
        teams,
      });

      for (const mp of draftList) {
        await sendMessage(
          channel,
          `\`!put @${mp.player_id} ${mp.team === 1 ? 'USMC' : 'MEC'} ${puboMatch.id}\``
        );
        await wait(1);
      }
    }
  };
}
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
function toResults(validEmojis: Array<LocationEmoji | PollEmoji>) {
  return (reaction: MessageReaction): PollResult | null => {
    if (reaction.emoji.name && validEmojis.some((k) => k === reaction.emoji.name)) {
      return [reaction.emoji.name, Array.from(reaction.users.cache.keys())];
    } else {
      return null;
    }
  };
}
function compareMessageReactionResults(match: MatchesJoined) {
  const matchPlayers = match.players.map((player) => player.id);
  return ([, votesA]: PollResult, [, votesB]: PollResult) =>
    getValidUsersCount(votesB, matchPlayers) - getValidUsersCount(votesA, matchPlayers);
}

function getValidUsersCount(users: Array<string>, matchPlayers: Array<string>) {
  return users.filter((user) => matchPlayers.includes(user)).length;
}
