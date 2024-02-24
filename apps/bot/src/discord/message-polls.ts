import {
  isNotNull,
  LocationEmoji,
  PollResult,
  MatchesJoined,
  PollEmoji,
  PickedMatchPlayer,
} from '@bf2-matchmaking/types';
import { Message, MessageReaction } from 'discord.js';
import { DateTime } from 'luxon';
import {
  buildDraftPollEmbed,
  createServerLocationPollField,
  getMatchField,
  buildDraftPollEndedEmbed,
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
import { PubobotMatch } from '../services/PubobotMatch';
import { wait } from '@bf2-matchmaking/utils/src/async-actions';
import { MessagePoll } from './MessagePoll';
import { isTeam } from '@bf2-matchmaking/utils/src/team-utils';
import { getUnpickList } from '../services/draft-service';

export async function createDraftPoll(
  pickList: Array<PickedMatchPlayer>,
  pubMatch: PubobotMatch
) {
  const pollEndTime = DateTime.now().plus({ minutes: 2 });
  const poll = await MessagePoll.createPoll(pubMatch.channel, {
    embeds: [
      buildDraftPollEmbed(
        pubMatch.match,
        pickList.flat(),
        pubMatch.players,
        null,
        pollEndTime
      ),
    ],
  });
  await poll
    .setEndtime(pollEndTime)
    .onReaction(handlePollReaction)
    .onPollEnd(handlePollEnd)
    .startPoll();

  logMessage(`Match ${pubMatch.match.id}: Draft poll started`, {
    pubMatch,
    pickList,
    poll,
  });

  function handlePollReaction(results: Array<PollResult>) {
    if (isDraftPollResolvedWithAccept(results, pickList)) {
      poll.stopPoll('Draft poll is resolved');
    }
    return {
      embeds: [
        buildDraftPollEmbed(
          pubMatch.match,
          pickList.flat(),
          pubMatch.players,
          results,
          pollEndTime
        ),
      ],
    };
  }
  function handlePollEnd(results: Array<PollResult>) {
    const isAccepted = isDraftPollResolvedWithAccept(results, pickList);
    logMessage(`Match ${pubMatch.match.id}: Poll ended`, {
      pubMatch,
      pickList,
      results,
      isAccepted,
    });
    if (isAccepted) {
      handleDraftAccepted(pubMatch, pickList);
    }
    return {
      embeds: [
        buildDraftPollEndedEmbed(
          pubMatch.match,
          pickList.flat(),
          pubMatch.players,
          results,
          isAccepted
        ),
      ],
    };
  }
}

function isDraftPollResolvedWithAccept(
  results: Array<PollResult>,
  pickList: Array<PickedMatchPlayer>
) {
  const acceptResult = results.find(([reaction]) => reaction === PollEmoji.ACCEPT);
  if (!acceptResult) {
    return false;
  }
  const [, votes] = acceptResult;
  return getTeamCount(votes, pickList, 1) > 1 && getTeamCount(votes, pickList, 2) > 1;
}

export async function handleDraftAccepted(
  pubMatch: PubobotMatch,
  pickList: Array<PickedMatchPlayer>
) {
  const unpickList = getUnpickList(pubMatch);

  logMessage(`Match ${pubMatch.match.id}: Executing suggested draft`, {
    PubobotMatch: pubMatch.id,
    match: pubMatch.match,
    unpickList,
    pickList,
  });

  for (const playerId of unpickList) {
    await sendMessage(pubMatch.channel, `!put <@${playerId}> Unpicked ${pubMatch.id}`);
    await wait(1);
  }

  for (const mp of pickList) {
    await sendMessage(
      pubMatch.channel,
      `!put <@${mp.player_id}> ${mp.team === 1 ? 'USMC' : 'MEC/PLA'} ${pubMatch.id}`
    );
    await wait(1);
  }
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
        .sort(compareMessageReactionResultsOld(match.players.map((p) => p.id)));

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
export function toResults(validEmojis: Array<LocationEmoji | PollEmoji>) {
  return (reaction: MessageReaction): PollResult | null => {
    if (reaction.emoji.name && validEmojis.some((k) => k === reaction.emoji.name)) {
      return [reaction.emoji.name, Array.from(reaction.users.cache.keys())];
    } else {
      return null;
    }
  };
}

export function compareMessageReactionResults(resA: PollResult, resB: PollResult) {
  return resB[1].length - resA[1].length;
}
export function compareMessageReactionResultsOld(players: Array<string>) {
  return ([, votesA]: PollResult, [, votesB]: PollResult) =>
    getValidUsersCount(votesB, players) - getValidUsersCount(votesA, players);
}

function getValidUsersCount(users: Array<string>, matchPlayers: Array<string>) {
  return users.filter((user) => matchPlayers.includes(user)).length;
}

function getTeamCount(
  voters: Array<string>,
  players: Array<PickedMatchPlayer>,
  team: 1 | 2
) {
  const teamPlayers = players.filter(isTeam(team)).map((mp) => mp.player_id);
  return voters.filter((voter) => teamPlayers.includes(voter)).length;
}
